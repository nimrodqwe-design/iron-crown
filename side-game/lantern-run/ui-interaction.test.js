'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const game=require('./game-state.js');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const inline=[...html.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/g)].map(match=>match[1]).filter(source=>source.trim());
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
   const names=new Set(this.className.split(/\\s+/).filter(Boolean));
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
const grid=new Element('div'),status=new Element('div'),restart=new Element('button');
const movement=['up','left','down','right'].map(direction=>new Element('button',{move:direction}));
const elements={grid,status,restart};
const document={
 body:new Element('body'),
 listeners:{},
 getElementById:id=>elements[id]||null,
 createElement:tag=>new Element(tag),
 querySelectorAll:selector=>selector.includes('data-move')?movement:[],
 addEventListener(type,handler){(this.listeners[type]||(this.listeners[type]=[])).push(handler)},
 dispatch(type,event){const value={target:this.body,defaultPrevented:false,preventDefault(){this.defaultPrevented=true},altKey:false,ctrlKey:false,metaKey:false,...event};(this.listeners[type]||[]).forEach(handler=>handler(value));return value}
};
const context={document};
context.window=context;
context.LanternRunState=game;
vm.createContext(context);
vm.runInContext(inline[0],context,{filename:'lantern-run-ui.js'});
const cell=(x,y)=>grid.children[y*game.SIZE+x];
const playerAt=(x,y)=>grid.children.findIndex(node=>node.className.split(' ').includes('player'))===y*game.SIZE+x;
const button=direction=>movement.find(item=>item.dataset.move===direction);

assert.equal(grid.children.length,25,'initial board renders all 25 cells');
assert.equal(playerAt(0,4),true,'player starts in the lower-left cell');
assert.equal(status.textContent,'Lantern light: 12.');
assert.equal(cell(4,0).getAttribute('aria-label').startsWith('Exit'),true);

button('left').click();
assert.equal(playerAt(0,4),true,'blocked button movement must not move the player');
assert.equal(status.textContent,'The darkness blocks that way.');

const key= document.dispatch('keydown',{key:'ArrowUp'});
assert.equal(key.defaultPrevented,true,'handled arrow keys prevent page scrolling');
assert.equal(playerAt(0,3),true,'keyboard movement updates the rendered position');
assert.equal(status.textContent,'Lantern light: 11.');

document.dispatch('keydown',{key:'ArrowRight',target:button('right')});
assert.equal(playerAt(0,3),true,'focused buttons must not also receive global arrow-key movement');

button('right').click();
assert.match(status.textContent,/Run ended/,'trap movement ends the run');
assert.equal(button('up').disabled,true,'movement controls disable after an ending');

restart.click();
assert.equal(playerAt(0,4),true,'restart returns the player to the start');
assert.equal(button('up').disabled,false,'restart re-enables movement');
assert.equal(status.textContent,'Lantern light: 12.');

['up','up','right','right','right','up','up','right'].forEach(direction=>button(direction).click());
assert.match(status.textContent,/You escaped the ruins/,'the known safe route reaches the exit');
assert.equal(button('right').disabled,true,'movement remains disabled after escape');

restart.click();
assert.equal(playerAt(0,4),true,'restart also works after victory');
console.log('Lantern Run DOM interaction checks passed');
