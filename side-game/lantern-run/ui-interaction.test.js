'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const game=require('./game-state.js');
const progressApi=require('./progress.js');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const inline=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match=>match[1]).filter(source=>source.trim());
assert.equal(inline.length,1,'expected one inline UI controller');

class Element{
 constructor(tag,dataset){
  this.tagName=(tag||'div').toUpperCase();
  this.dataset=dataset||{};
  this.attributes={};
  this.children=[];
  this.listeners={};
  this.disabled=false;
  this.textContent='';
  this.className='';
  this.isContentEditable=false;
  this.classList={add:name=>{
   const names=new Set(this.className.split(/\s+/).filter(Boolean));
   names.add(name);
   this.className=[...names].join(' ');
  }};
 }
 setAttribute(name,value){this.attributes[name]=String(value)}
 getAttribute(name){return this.attributes[name]??null}
 append(...items){this.children.push(...items)}
 replaceChildren(...items){this.children=[...items]}
 addEventListener(type,handler){(this.listeners[type]||(this.listeners[type]=[])).push(handler)}
 dispatch(type,event){
  const value={target:this,defaultPrevented:false,preventDefault(){this.defaultPrevented=true},altKey:false,ctrlKey:false,metaKey:false,...event};
  (this.listeners[type]||[]).forEach(handler=>handler(value));
  return value;
 }
 click(){if(!this.disabled)this.dispatch('click')}
}
const grid=new Element('div'),status=new Element('div'),restart=new Element('button'),hint=new Element('button'),lightMeter=new Element('progress'),lightValue=new Element('output'),moveCount=new Element('output'),scoreValue=new Element('output'),bestScore=new Element('output'),hintCount=new Element('output');
lightMeter.value=0;lightMeter.max=12;
const movement=['up','left','down','right'].map(direction=>new Element('button',{move:direction}));
const elements={grid,status,restart,hint,lightMeter,lightValue,moveCount,scoreValue,bestScore,hintCount};
const document={
 body:new Element('body'),
 listeners:{},
 getElementById:id=>elements[id]||null,
 createElement:tag=>new Element(tag),
 querySelectorAll:selector=>selector.includes('data-move')?movement:[],
 addEventListener(type,handler){(this.listeners[type]||(this.listeners[type]=[])).push(handler)},
 dispatch(type,event){const value={target:this.body,defaultPrevented:false,preventDefault(){this.defaultPrevented=true},altKey:false,ctrlKey:false,metaKey:false,...event};(this.listeners[type]||[]).forEach(handler=>handler(value));return value}
};
const stored=new Map();
const storage={getItem:key=>stored.has(key)?stored.get(key):null,setItem:(key,value)=>stored.set(key,String(value))};
const context={document,localStorage:storage};
context.window=context;
context.LanternRunState=game;
context.LanternRunProgress=progressApi;
vm.createContext(context);
vm.runInContext(inline[0],context,{filename:'lantern-run-ui.js'});
const cell=(x,y)=>grid.children[y*game.SIZE+x];
const playerAt=(x,y)=>grid.children.findIndex(node=>node.className.split(' ').includes('player'))===y*game.SIZE+x;
const button=direction=>movement.find(item=>item.dataset.move===direction);

assert.equal(grid.children.length,25,'initial board renders all 25 cells');
assert.equal(playerAt(0,4),true,'player starts in the lower-left cell');
assert.equal(status.textContent,'Ruin 1 · Lantern light: 12.');
assert.equal(lightMeter.value,12,'HUD meter starts full');
assert.equal(lightValue.textContent,'12 / 12');
assert.equal(moveCount.textContent,'Moves: 0');
assert.equal(scoreValue.textContent,'Score: —');
assert.equal(bestScore.textContent,'Best: —');
assert.equal(hintCount.textContent,'Hints: 0');
assert.equal(hint.disabled,false,'safe hint is available at the start');
hint.click();
assert.match(status.textContent,/Hint: move (up|right|down|left)\. This does not consume lantern light, but reduces your final score\./);
assert.equal(playerAt(0,4),true,'hint does not move the player');
assert.equal(lightMeter.value,12,'hint does not change the visible light meter');
assert.equal(moveCount.textContent,'Moves: 0','hint does not increment the move count');
assert.equal(hintCount.textContent,'Hints: 1','hint use is recorded for scoring');
assert.equal(cell(4,0).getAttribute('aria-label').startsWith('Exit'),true);

button('left').click();
assert.equal(playerAt(0,4),true,'blocked button movement must not move the player');
assert.equal(status.textContent,'The darkness blocks that way.');

const key= document.dispatch('keydown',{key:'ArrowUp'});
assert.equal(key.defaultPrevented,true,'handled arrow keys prevent page scrolling');
assert.equal(playerAt(0,3),true,'keyboard movement updates the rendered position');
assert.equal(status.textContent,'Ruin 1 · Lantern light: 11.');
assert.equal(lightMeter.value,11,'legal movement updates the light meter');
assert.equal(lightValue.textContent,'11 / 12');
assert.equal(moveCount.textContent,'Moves: 1');

document.dispatch('keydown',{key:'ArrowRight',target:button('right')});
assert.equal(playerAt(0,3),true,'focused buttons must not also receive global arrow-key movement');

button('right').click();
assert.match(status.textContent,/Run ended/,'trap movement ends the run');
assert.equal(lightMeter.value,10,'trap entry still updates the remaining-light meter');
assert.equal(moveCount.textContent,'Moves: 2');
assert.equal(button('up').disabled,true,'movement controls disable after an ending');

assert.equal(restart.textContent,'Try again','a failed ruin offers a retry rather than a skip');
restart.click();
assert.equal(playerAt(0,4),true,'retry returns the player to the start');
assert.equal(button('up').disabled,false,'retry re-enables movement');
assert.equal(status.textContent,'Ruin 1 · Lantern light: 12.','failure keeps the current ruin selected');
assert.equal(lightMeter.value,12,'retry resets the lantern meter');
assert.equal(moveCount.textContent,'Moves: 0','retry resets the move count');
assert.equal(hintCount.textContent,'Hints: 0','retry resets the hint penalty');
hint.click();
assert.equal(hintCount.textContent,'Hints: 1','a hint used on the successful run is counted');
assert.equal(restart.textContent,'Restart ruin');

['up','up','right','right','right','up','up','right'].forEach(direction=>button(direction).click());
assert.match(status.textContent,/Ruin 1 · You escaped/,'the first layout safe route reaches the exit');
assert.equal(scoreValue.textContent,'Score: 620','a hinted escape receives the assisted score');
assert.equal(bestScore.textContent,'Best: 620','a successful escape records a per-ruin best');
assert.ok(stored.has(progressApi.KEY),'personal best is persisted');
assert.equal(button('right').disabled,true,'movement remains disabled after escape');
assert.equal(restart.textContent,'Next ruin','a successful escape unlocks progression');

restart.click();
assert.equal(playerAt(0,4),true,'next ruin starts at the entrance');
assert.equal(status.textContent,'Ruin 2 · Lantern light: 12.');

['up','right','up','right','up','up','right','right'].forEach(direction=>button(direction).click());
assert.match(status.textContent,/Ruin 2 · You escaped/,'the second layout safe route reaches the exit');
assert.equal(scoreValue.textContent,'Score: 720');
assert.equal(bestScore.textContent,'Best: 720','each ruin keeps its own best score');
restart.click();
assert.equal(status.textContent,'Ruin 3 · Lantern light: 12.');

restart.click();
assert.equal(status.textContent,'Ruin 3 · Lantern light: 12.','restarting an active run does not skip the current ruin');
['up','right','right','right','up','up','right','up'].forEach(direction=>button(direction).click());
assert.match(status.textContent,/Ruin 3 · You escaped/,'the third layout safe route reaches the exit');
assert.equal(scoreValue.textContent,'Score: 720');
assert.equal(bestScore.textContent,'Best: 720');
restart.click();
assert.equal(status.textContent,'Ruin 1 · Lantern light: 12.','the completed three-ruin sequence cycles back to the first');
console.log('Lantern Run DOM interaction checks passed');
