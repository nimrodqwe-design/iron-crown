'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context={window:{crypto:{randomUUID:()=> 'loyalty-runtime-test'}}};
vm.createContext(context);
for(const file of [
 'js/characters/campaign-roster.js',
 'js/characters/loyalty.js',
 'js/characters/campaign-loyalty-adapter.js',
 'js/characters/campaign-loyalty-runtime.js'
])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const roster=context.window.IronCrownCharacters.create({campaignId:'loyalty-runtime-test'});
const scholar=roster.add({name:'Sella',role:'specialist',motivation:'knowledge',trust:50,morale:60});
const scout=roster.add({name:'Iven',role:'officer',motivation:'glory',trust:50,morale:60});
let resolved=[];
const runtime=context.window.IronCrownCampaignLoyaltyRuntime.create({roster,getResolvedEventIds:()=>resolved,setResolvedEventIds:ids=>{resolved=ids}});
assert.equal(runtime.record('troops:discovery',[]).ok,false,'events without named participants are ignored');
assert.equal(runtime.record('unknown:event',[scholar.id]).ok,false,'unsupported events are rejected');
assert.equal(runtime.record('troops:discovery',['missing-character']).ok,false,'unknown participants are rejected');
assert.deepEqual(resolved,[],'rejected actions do not enter the replay ledger');
const first=runtime.record('troops:discovery',[scholar.id,scout.id]);
assert.equal(first.ok,true);
assert.equal(first.eventId,'ic:loyalty-runtime-test:event:1','campaign event IDs use the persisted roster sequence');
assert.equal(roster.get(scholar.id).trust,54,'knowledge motivation gains discovery trust');
assert.equal(roster.get(scholar.id).morale,68,'knowledge motivation gains discovery morale');
assert.equal(roster.get(scout.id).trust,51,'other active companions receive the base discovery effect');
assert.equal(roster.get(scout.id).morale,63);
assert.deepEqual(JSON.parse(JSON.stringify(resolved)),[first.eventId]);
const afterFirst=roster.get(scholar.id);
const replay=runtime.apply({type:'troops:discovery',eventId:first.eventId,recruitIds:[scholar.id,scout.id]});
assert.equal(replay.ok,true);
assert.equal(replay.duplicate,true,'the same campaign event cannot apply twice in one session');
assert.deepEqual(roster.get(scholar.id),afterFirst);
const restoredRoster=context.window.IronCrownCharacters.restore(roster.snapshot());
let restoredLedger=resolved.slice();
const restoredRuntime=context.window.IronCrownCampaignLoyaltyRuntime.create({roster:restoredRoster,getResolvedEventIds:()=>restoredLedger,setResolvedEventIds:ids=>{restoredLedger=ids}});
const restoredBefore=restoredRoster.get(scholar.id);
const replayAfterLoad=restoredRuntime.apply({type:'troops:discovery',eventId:first.eventId,recruitIds:[scholar.id,scout.id]});
assert.equal(replayAfterLoad.duplicate,true,'the saved campaign ledger blocks replay after reload');
assert.deepEqual(restoredRoster.get(scholar.id),restoredBefore);
const second=restoredRuntime.record('troops:discovery',[scholar.id]);
assert.equal(second.eventId,'ic:loyalty-runtime-test:event:2','event sequence survives roster restoration');
assert.equal(restoredRoster.get(scholar.id).trust,58);
assert.deepEqual(JSON.parse(JSON.stringify(restoredLedger)),[first.eventId,second.eventId]);
console.log('campaign non-battle loyalty runtime and replay checks passed');
