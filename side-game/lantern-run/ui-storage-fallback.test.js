'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const game=require('./game-state.js');
const progressApi=require('./progress.js');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const inline=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match=>match[1]).filter(source=>source.trim());
assert.equal(inline.length,1,'expected one inline UI controller');
class Element{
 constructor(tag,dataset){
  this.tagName=(tag||'div').toUpperCase();this.dataset=dataset||{};this.attributes={};this.children=[];this.listeners={};this.disabled=false;this.textContent='';this.className='';this.isContentEditable=false;
  this.classList={add:name=>{const names=new Set(this.className.split(/\s+/).filter(Boolean));names.add(name);this.className=[...names].join(' ')}};
 }
 setAttribute(name,value){this.attributes[name]=String(value)}
 getAttribute(name){return this.attributes[name]??null}
 append(...items){this.children.push(...items)}
 replaceChildren(...items){this.children=[...items]}
 addEventListener(type,handler){(this.listeners[type]||(this.listeners[type]=[])).push(handler)}
 dispatch(type,event){const value={target:this,defaultPrevented:false,preventDefault(){this.defaultPrevented=true},altKey:false,ctrlKey:false,metaKey:false,...event};(this.listeners[type]||[]).forEach(handler=>handler(value));return value}
 click(){if(!this.disabled)this.dispatch('click')}
}
const grid=new Element('div'),status=new Element('div'),restart=new Element('button'),hint=new Element('button');
const lightMeter=new Element('progress'),lightValue=new Element('output'),moveCount=new Element('output');
const scoreValue=new Element('output'),bestScore=new Element('output'),hintCount=new Element('output');
lightMeter.value=0;lightMeter.max=12;
const movement=['up','left','down','right'].map(direction=>new Element('button',{move:direction}));
const elements={grid,status,restart,hint,lightMeter,lightValue,moveCount,scoreValue,bestScore,hintCount};
const document={getElementById:id=>elements[id]||null,createElement:tag=>new Element(tag),querySelectorAll:selector=>selector.includes('data-move')?movement:[],addEventListener(){}};
const context={document,LanternRunState:game,LanternRunProgress:progressApi};
context.window=context;
Object.defineProperty(context,'localStorage',{configurable:true,get(){throw new Error('localStorage access blocked')}});
vm.createContext(context);
vm.runInContext(inline[0],context,{filename:'lantern-run-ui-storage-fallback.js'});
const button=direction=>movement.find(item=>item.dataset.move===direction);
assert.equal(bestScore.textContent,'Best: —');
['up','up','right','right','right','up','up','right'].forEach(direction=>button(direction).click());
assert.equal(scoreValue.textContent,'Score: 720','the game still calculates the completed run score');
assert.equal(bestScore.textContent,'Best: 720','an in-memory store retains the session best');
assert.match(status.textContent,/New session best: 720\./,'the UI clearly reports that the record is session-only');
assert.doesNotMatch(status.textContent,/New personal best saved/,'the UI must not claim persistence when storage access failed');
console.log('Lantern Run localStorage getter fallback interaction checks passed');
