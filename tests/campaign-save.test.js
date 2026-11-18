'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const values=new Map();
const storage={getItem:key=>values.has(key)?values.get(key):null,setItem:(key,value)=>values.set(key,String(value))};
const context={window:{crypto:{randomUUID:()=> 'fresh-campaign'}},localStorage:storage,console};
vm.createContext(context);
for(const file of ['js/characters/campaign-roster.js','js/core/state.js','js/core/save.js']){
 vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
}
const notices=[];
const makeSystem=state=>context.window.IronCrownSave.create({
 getState:()=>state,
 getPlace:id=>id==='greyhaven'?{id}:null,
 getDiscoveryIds:()=>['discovery-one'],
 getItemIds:slot=>slot==='weapon'?['worn-blade']:slot==='armour'?['travel-cloak']:slot?[]:['worn-blade','travel-cloak'],
 getCharacterRoster:()=>state.characterRoster.snapshot(),
 setCharacterRoster:snapshot=>{state.characterRoster=context.window.IronCrownCharacters.restore(snapshot,{onWarning:message=>notices.push(message)});},
 createCharacterRoster:()=>context.window.IronCrownCharacters.create(),
 notify:message=>notices.push(message),
 version:context.window.IronCrownState.saveVersion
});
const legacyV5={version:5,state:{current:'greyhaven',gold:143,troops:19,health:72,day:4,minutes:615,camped:true,supplies:8,inventory:['worn-blade','travel-cloak'],equipment:{weapon:'worn-blade',armour:'travel-cloak'},discoveries:['discovery-one'],defeatedParties:['red-bandits'],metCaravans:['west-caravan'],houseStanding:{alder:5,veyne:2,rowan:0},audiences:['alder']}};
storage.setItem('ironCrownSave',JSON.stringify(legacyV5));
const firstState=context.window.IronCrownState.createInitialState();
const first=makeSystem(firstState);
assert.strictEqual(first.load(),true);
assert.strictEqual(firstState.gold,143);
assert.strictEqual(firstState.troops,19);
assert.strictEqual(firstState.health,72);
assert.strictEqual(firstState.day,4);
assert.strictEqual(firstState.supplies,8);
assert.strictEqual(firstState.characterRoster.list().length,0,'v5 migration must not invent named characters');
const migrated=JSON.parse(storage.getItem('ironCrownSave'));
assert.strictEqual(migrated.version,7);
assert.strictEqual(migrated.state.troops,19);
assert.strictEqual(migrated.state.characterRoster.characters.length,0);
assert.deepStrictEqual(migrated.state.activePartyIds,[],'v5 migration starts with an empty named party');
const campaignId=migrated.state.characterRoster.campaignId;
const recruit=firstState.characterRoster.add({candidateId:'mara-kingsbridge',name:'Mara',role:'companion',motivation:'glory',trust:72,morale:64});
assert.strictEqual(recruit.id,'ic:'+campaignId+':character:1');
assert.strictEqual(firstState.characterRoster.createEventId(),'ic:'+campaignId+':event:1');
assert.strictEqual(first.save(),true);
const secondState=context.window.IronCrownState.createInitialState();
const second=makeSystem(secondState);
assert.strictEqual(second.load(),true);
assert.strictEqual(secondState.characterRoster.get(recruit.id).name,'Mara');
assert.strictEqual(secondState.characterRoster.get(recruit.id).trust,72);
assert.strictEqual(secondState.characterRoster.get(recruit.id).candidateId,'mara-kingsbridge','candidate source identity must survive save/load');
assert.strictEqual(secondState.characterRoster.getCampaignId(),campaignId);
const secondRecruit=secondState.characterRoster.add({name:'Iven',role:'officer'});
assert.strictEqual(secondRecruit.id,'ic:'+campaignId+':character:2');
assert.strictEqual(secondState.characterRoster.createEventId(),'ic:'+campaignId+':event:2');
secondState.activePartyIds=[recruit.id,secondRecruit.id];
assert.strictEqual(second.save(),true,'active party assignments must save');
const thirdState=context.window.IronCrownState.createInitialState();
const third=makeSystem(thirdState);
assert.strictEqual(third.load(),true);
assert.deepStrictEqual(thirdState.activePartyIds,[recruit.id,secondRecruit.id],'active party assignments must survive save/load');
const invalid=JSON.parse(storage.getItem('ironCrownSave'));
invalid.state.activePartyIds=[recruit.id,recruit.id,'unknown-character',secondRecruit.id];
storage.setItem('ironCrownSave',JSON.stringify(invalid));
const fourthState=context.window.IronCrownState.createInitialState();
const fourth=makeSystem(fourthState);
assert.strictEqual(fourth.load(),true);
assert.deepStrictEqual(fourthState.activePartyIds,[recruit.id,secondRecruit.id],'load removes duplicate and unknown party IDs');
const v6={version:6,state:{current:'greyhaven',gold:40,troops:7,characterRoster:{version:2,campaignId:'v6-campaign',nextCharacterSequence:2,nextEventSequence:1,characters:[{id:'ic:v6-campaign:character:1',name:'Legacy Mara',role:'companion',background:'Former guard',candidateId:null,motivation:'coin',status:'available',recruited:true,trust:50,morale:60}]}}};
storage.setItem('ironCrownSave',JSON.stringify(v6));
const v6State=context.window.IronCrownState.createInitialState();
const v6System=makeSystem(v6State);
assert.strictEqual(v6System.load(),true,'v6 saves migrate to v7');
assert.strictEqual(v6State.troops,7);
assert.strictEqual(v6State.characterRoster.list()[0].name,'Legacy Mara');
assert.deepStrictEqual(v6State.activePartyIds,[]);
assert.strictEqual(JSON.parse(storage.getItem('ironCrownSave')).version,7);
const newer={version:8,state:{current:'greyhaven'}};
storage.setItem('ironCrownSave',JSON.stringify(newer));
assert.strictEqual(second.load(),false,'newer saves must not be overwritten');
assert.strictEqual(storage.getItem('ironCrownSave'),JSON.stringify(newer));
console.log('campaign save v6 migration and round-trip checks passed');