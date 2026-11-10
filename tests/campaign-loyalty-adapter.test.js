'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context={window:{}};
vm.runInNewContext(fs.readFileSync('js/characters/loyalty.js','utf8'),context);
vm.runInNewContext(fs.readFileSync('js/characters/campaign-loyalty-adapter.js','utf8'),context);
const loyalty=context.window.IronCrownLoyalty.create({recruits:[
 {id:'r1',name:'Mira',motivation:'loyalty',trust:50,morale:50},
 {id:'r2',name:'Tomas',motivation:'coin',trust:50,morale:50}
]});
const chronicle=[];
const adapter=context.window.IronCrownCampaignLoyaltyAdapter.create({loyalty,onChronicle:e=>chronicle.push(e)});
assert.equal(adapter.apply({type:'troops:promise-kept',eventId:'promise-1',recruitIds:['r1']}).ok,true);
assert.equal(loyalty.getStanding('r1').trust,62);
assert.equal(adapter.apply({type:'troops:promise-kept',eventId:'promise-1',recruitIds:['r1']}).results[0].duplicate,true);
assert.equal(adapter.apply({type:'unknown',eventId:'x',recruitIds:['r1']}).ok,false);
assert.equal(adapter.apply({type:'troops:paid',eventId:'pay-1',recruitIds:['r2']}).ok,true);
const battle=adapter.applyBattleResult({battleId:'b-17',outcome:'victory',participantIds:['r1','r2']});
assert.equal(battle.ok,true);
assert.equal(loyalty.getStanding('r1').morale,65);
assert.equal(adapter.applyBattleResult({battleId:'b-17',outcome:'victory',participantIds:['r1','r2']}).results[0].duplicate,true);
assert.equal(adapter.applyBattleResult({battleId:'b-18',outcome:'draw',participantIds:['r1']}).ok,false);
assert.equal(adapter.apply({type:'troops:paid',eventId:'bad',recruitIds:[]}).ok,false);
assert.equal(chronicle.every(e=>e.type==='recruit:standing-changed'),true);
console.log('campaign loyalty adapter tests passed');
