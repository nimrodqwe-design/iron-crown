'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const BattleView=require('../js/battle/battle-view.js');

class Element{
 constructor(tag='div',attributes={}){
  this.tagName=tag.toUpperCase();this.attributes={...attributes};this.listeners={};
  this.hidden=false;this.disabled=false;this.textContent='';this.focused=false;
 }
 addEventListener(type,handler){(this.listeners[type]||(this.listeners[type]=[])).push(handler)}
 removeEventListener(type,handler){this.listeners[type]=(this.listeners[type]||[]).filter(item=>item!==handler)}
 dispatch(type,event={}){
  const value={target:this,defaultPrevented:false,preventDefault(){this.defaultPrevented=true},...event};
  (this.listeners[type]||[]).forEach(handler=>handler(value));return value;
 }
 click(){if(!this.disabled)this.dispatch('click')}
 setAttribute(name,value){this.attributes[name]=String(value)}
 getAttribute(name){return this.attributes[name]??null}
 setPointerCapture(){}
 focus(){this.focused=true}
}
const drawnText=[];
const context=new Proxy({},{
 get(target,key){if(!(key in target))target[key]=key==='fillText'?(value=>drawnText.push(String(value))):()=>{};return target[key]},
 set(target,key,value){target[key]=value;return true}
});
const elements={
 root:new Element('section'),canvas:new Element('canvas'),title:new Element('h2'),subtitle:new Element('p'),
 heroHealth:new Element('b'),friendlyCount:new Element('b'),enemyCount:new Element('b'),order:new Element('b'),
 message:new Element('p'),result:new Element('section'),resultTitle:new Element('h3'),resultText:new Element('p'),
 continueButton:new Element('button'),retreatButton:new Element('button'),attackButton:new Element('button'),pauseButton:new Element('button')
};
elements.root.hidden=true;elements.canvas.getContext=()=>context;
const moveButtons=['up','left','down','right'].map(direction=>new Element('button',{'data-battle-move':direction}));
const orderButtons=['advance','hold','regroup'].map(order=>new Element('button',{'data-battle-order':order}));
elements.moveButtons=moveButtons;elements.orderButtons=orderButtons;
const document=new Element('document');
let snapshot={
 battleId:'battle-view-test',phase:'active',order:'advance',
 hero:{id:'hero',x:500,y:440,hp:90,maxHp:100,facingX:1,facingY:0},
 friendly:[{id:'friend-1',team:'friendly',x:430,y:420,hp:40,maxHp:50,characterId:'char-1',name:'Mara Venn'}],
 enemy:[{id:'enemy-1',team:'enemy',x:650,y:180,hp:50,maxHp:50}],
 remaining:{friendly:1,enemy:1}
};
let lastInput=null,steps=0,orders=[],retreats=0,checkpoints=0,completed=[],closed=[];
let result=null;
const controller={
 active:()=>snapshot.phase==='active',
 snapshot:()=>JSON.parse(JSON.stringify(snapshot)),
 setPlayerInput(input){lastInput={...input};return true},
 issueOrder(order){orders.push(order);snapshot.order=order;return ['advance','hold','regroup'].includes(order)},
 step(delta){steps++;snapshot.hero.x+=((lastInput&&lastInput.moveX)||0)*delta*170;return this.snapshot()},
 getResult:()=>result,
 retreat(){retreats++;snapshot.phase='ended';result={battleId:snapshot.battleId,outcome:'defeat',reason:'retreated',survivors:{friendly:{foot:1}}};return {ok:true,result}}
};
const frames=[];let cancelled=[];
const view=BattleView.create({
 controller,elements,document,
 requestFrame:callback=>{frames.push(callback);return frames.length},
 cancelFrame:id=>cancelled.push(id),
 returnFocus:{focus(){closed.push('focus')}},
 onComplete:value=>completed.push(value),
 onCheckpoint:()=>{checkpoints++},
 onClose:value=>closed.push(value)
});
assert.equal(view.open({enemyName:'Redvale Raiders'}),true);
assert.equal(elements.root.hidden,false);
assert.equal(elements.root.getAttribute('aria-hidden'),'false');
assert.equal(elements.title.textContent,'Battle at Redvale Raiders');
assert.equal(elements.heroHealth.textContent,'90/100');
assert.equal(elements.friendlyCount.textContent,'1');
assert.equal(elements.enemyCount.textContent,'1');
assert.equal(elements.canvas.focused,true);
assert.ok(drawnText.includes('Mara Venn'),'battlefield labels named companions for player recognition');

document.dispatch('keydown',{key:'ArrowUp',target:elements.canvas});
let frame=frames.shift();frame(16);
assert.equal(lastInput.moveY,-1,'keyboard movement reaches the campaign controller');
assert.equal(steps,1);
document.dispatch('keyup',{key:'ArrowUp',target:elements.canvas});
const right=moveButtons.find(button=>button.getAttribute('data-battle-move')==='right');
right.dispatch('pointerdown',{pointerId:1,preventDefault(){}});
frame=frames.shift();frame(32);
assert.equal(lastInput.moveX,1,'touch movement reaches the campaign controller');
right.dispatch('pointerup',{pointerId:1,preventDefault(){}});
orderButtons.find(button=>button.getAttribute('data-battle-order')==='hold').click();
assert.deepEqual(orders,['hold'],'order buttons issue authoritative simulation orders');
assert.equal(elements.order.textContent,'Hold');
elements.attackButton.click();
assert.equal(lastInput.attack,true,'attack button sends a player attack input');
const stepsAtPause=steps;
elements.pauseButton.click();
assert.equal(view.paused(),true,'pause control freezes the battlefield');
assert.equal(view.active(),true,'a paused battle remains an active encounter');
assert.equal(elements.pauseButton.textContent,'Resume battle');
assert.equal(elements.pauseButton.getAttribute('aria-pressed'),'true');
assert.equal(elements.attackButton.disabled,true,'combat input is disabled while paused');
assert.equal(elements.retreatButton.disabled,false,'retreat remains available while paused');
assert.equal(checkpoints,1,'pausing checkpoints the active campaign battle');
const staleFrame=frames.shift();staleFrame(48);
assert.equal(steps,stepsAtPause,'a queued animation frame cannot advance a paused battle');
document.dispatch('keydown',{key:'p',target:elements.canvas});
assert.equal(view.paused(),false,'P resumes a paused battle');
assert.equal(elements.pauseButton.textContent,'Pause battle');
const resumedFrame=frames.shift();resumedFrame(64);
assert.equal(steps,stepsAtPause+1,'resumed battle advances on its next frame');
elements.pauseButton.click();
assert.equal(view.paused(),true);
assert.equal(checkpoints,2);
elements.retreatButton.click();
assert.equal(retreats,1);
assert.equal(completed.length,1,'battle completion is reported exactly once');
assert.equal(completed[0].reason,'retreated');
assert.equal(elements.result.hidden,false);
assert.equal(elements.resultTitle.textContent,'Retreat');
assert.match(elements.resultText.textContent,/withdrew/);
assert.equal(elements.retreatButton.disabled,true);
assert.equal(elements.pauseButton.disabled,true,'pause control disables after battle completion');
elements.continueButton.click();
assert.equal(elements.root.hidden,true,'continue returns to the campaign');
assert.equal(closed.length,2,'close callback and focus restoration both run');

const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const game=fs.readFileSync(path.join(__dirname,'../js/game.js'),'utf8');
const shell=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');
assert.match(html,/id="battleOverlay"/);
assert.match(html,/id="battleCanvas"/);
assert.match(html,/id="battlePause"/);
assert.match(game,/onCheckpoint:save/,'pausing saves the resumable campaign checkpoint');
assert.match(html,/data-battle-order="regroup"/);
assert.match(game,/battleView\.open\(\{enemyName:p\.name,faction:p\.faction\}\)/);
assert.doesNotMatch(game,/campaignBattle\.autoResolve\(\)/,'hostile map encounters must no longer auto-resolve');
assert.match(shell,/iron-crown-shell-v20/);
assert.match(game,/campaignBattle\.restore\(state\.activeBattle\)/,'saved active battles are restored on campaign startup');
assert.match(shell,/\.\/js\/battle\/battle-view\.js/);
console.log('Battlefield view interaction checks passed');
