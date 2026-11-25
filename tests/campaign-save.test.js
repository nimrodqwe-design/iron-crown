'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const values=new Map();
const storage={getItem:key=>values.has(key)?values.get(key):null,setItem:(key,value)=>values.set(key,String(value))};
const context={window:{crypto:{randomUUID:()=> 'fresh-campaign'}},localStorage:storage,console};
vm.createContext(context);
for(const file of ['js/data/world.js','js/characters/campaign-roster.js','js/core/campaign-time.js','js/core/campaign-resources.js','js/core/state.js','js/core/save.js']){
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
 resourceApi:context.window.IronCrownCampaignResources,
 getResourceSites:()=>context.window.IronCrownWorld.resourceSites,
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
assert.strictEqual(firstState.lastCompanionPayDay,0,'legacy saves start with no paid companion day');
assert.strictEqual(firstState.resourceStock['greyhaven-grain'],24);
assert.strictEqual(firstState.rawMaterials.grain,0);
const migrated=JSON.parse(storage.getItem('ironCrownSave'));
assert.strictEqual(migrated.version,12);
assert.strictEqual(migrated.state.troops,19);
assert.strictEqual(migrated.state.characterRoster.characters.length,0);
assert.strictEqual(migrated.state.activeBattle,null,'legacy saves start without an in-progress battle checkpoint');
assert.deepStrictEqual(migrated.state.activePartyIds,[],'v5 migration starts with an empty named party');
const campaignId=migrated.state.characterRoster.campaignId;
const recruit=firstState.characterRoster.add({candidateId:'mara-kingsbridge',name:'Mara',role:'companion',motivation:'glory',trust:72,morale:64});
assert.strictEqual(recruit.id,'ic:'+campaignId+':character:1');
const firstEventId=firstState.characterRoster.createEventId();
assert.strictEqual(firstEventId,'ic:'+campaignId+':event:1');
firstState.resolvedCampaignEventIds=[firstEventId];
firstState.resourceStock['greyhaven-grain']=21;firstState.rawMaterials.grain=3;
firstState.lastCompanionPayDay=3;
firstState.activeBattle={version:1,pending:{battleId:'saved-battle',enemyId:'red-bandits',enemyName:'Redvale Raiders',participantIds:[],initialTroops:19},simulation:{version:1,battle:{battleId:'saved-battle'}}};
assert.strictEqual(first.save(),true);
const secondState=context.window.IronCrownState.createInitialState();
const second=makeSystem(secondState);
assert.strictEqual(second.load(),true);
assert.deepStrictEqual(JSON.parse(JSON.stringify(secondState.resolvedCampaignEventIds)),[firstEventId],'non-battle event replay ledger survives save/load');
assert.deepStrictEqual(JSON.parse(JSON.stringify(secondState.activeBattle)),JSON.parse(JSON.stringify(firstState.activeBattle)),'active battle checkpoint survives save/load');
assert.strictEqual(secondState.lastCompanionPayDay,3,'daily companion payment day survives save/load');
assert.strictEqual(secondState.resourceStock['greyhaven-grain'],21);
assert.strictEqual(secondState.rawMaterials.grain,3);
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
assert.deepStrictEqual(JSON.parse(JSON.stringify(thirdState.activePartyIds)),[recruit.id,secondRecruit.id],'active party assignments must survive save/load');
const invalid=JSON.parse(storage.getItem('ironCrownSave'));
invalid.state.activePartyIds=[recruit.id,recruit.id,'unknown-character',secondRecruit.id];
storage.setItem('ironCrownSave',JSON.stringify(invalid));
const fourthState=context.window.IronCrownState.createInitialState();
const fourth=makeSystem(fourthState);
assert.strictEqual(fourth.load(),true);
assert.deepStrictEqual(JSON.parse(JSON.stringify(fourthState.activePartyIds)),[recruit.id,secondRecruit.id],'load removes duplicate and unknown party IDs');
const v6={version:6,state:{current:'greyhaven',gold:40,troops:7,characterRoster:{version:2,campaignId:'v6-campaign',nextCharacterSequence:2,nextEventSequence:1,characters:[{id:'ic:v6-campaign:character:1',name:'Legacy Mara',role:'companion',background:'Former guard',candidateId:null,motivation:'coin',status:'available',recruited:true,trust:50,morale:60}]}}};
storage.setItem('ironCrownSave',JSON.stringify(v6));
const v6State=context.window.IronCrownState.createInitialState();
const v6System=makeSystem(v6State);
assert.strictEqual(v6System.load(),true,'v6 saves migrate to v12');
assert.strictEqual(v6State.troops,7);
assert.strictEqual(v6State.characterRoster.list()[0].name,'Legacy Mara');
assert.deepStrictEqual(JSON.parse(JSON.stringify(v6State.activePartyIds)),[]);
assert.strictEqual(JSON.parse(storage.getItem('ironCrownSave')).version,12);
const v7={version:7,state:{current:'greyhaven',gold:30,troops:6,characterRoster:{version:2,campaignId:'v7-campaign',nextCharacterSequence:2,nextEventSequence:3,characters:[{id:'ic:v7-campaign:character:1',name:'Saved Mara',role:'companion',motivation:'glory',status:'available',trust:62,morale:71}]},activePartyIds:['ic:v7-campaign:character:1']}};
storage.setItem('ironCrownSave',JSON.stringify(v7));
const v7State=context.window.IronCrownState.createInitialState();
const v7System=makeSystem(v7State);
assert.strictEqual(v7System.load(),true,'v7 saves migrate to v12');
assert.strictEqual(v7State.troops,6);
assert.deepStrictEqual(JSON.parse(JSON.stringify(v7State.activePartyIds)),['ic:v7-campaign:character:1']);
assert.deepStrictEqual(JSON.parse(JSON.stringify(v7State.resolvedBattleIds)),[]);
assert.strictEqual(JSON.parse(storage.getItem('ironCrownSave')).version,12);

const v8={version:8,state:{current:'greyhaven',gold:44,troops:9,activePartyIds:[],resolvedBattleIds:['battle-old'],characterRoster:{version:2,campaignId:'v8-campaign',nextCharacterSequence:1,nextEventSequence:1,characters:[]}}};
storage.setItem('ironCrownSave',JSON.stringify(v8));
const v8State=context.window.IronCrownState.createInitialState();
const v8System=makeSystem(v8State);
assert.strictEqual(v8System.load(),true,'v8 saves migrate to v12');
assert.strictEqual(v8State.gold,44);
assert.deepStrictEqual(JSON.parse(JSON.stringify(v8State.resolvedBattleIds)),['battle-old'],'v8 battle replay ledger is preserved');
assert.strictEqual(JSON.parse(storage.getItem('ironCrownSave')).version,12);

const v9={version:9,state:{current:'greyhaven',gold:50,troops:10,activePartyIds:[],resolvedBattleIds:['battle-v9'],characterRoster:{version:2,campaignId:'v9-campaign',nextCharacterSequence:1,nextEventSequence:5,characters:[]}}};
storage.setItem('ironCrownSave',JSON.stringify(v9));
const v9State=context.window.IronCrownState.createInitialState();
const v9System=makeSystem(v9State);
assert.strictEqual(v9System.load(),true,'v9 saves migrate to v12');
assert.deepStrictEqual(JSON.parse(JSON.stringify(v9State.resolvedBattleIds)),['battle-v9'],'v9 battle replay ledger is preserved');
assert.deepStrictEqual(JSON.parse(JSON.stringify(v9State.resolvedCampaignEventIds)),[],'v9 saves receive an empty non-battle event ledger');
assert.strictEqual(JSON.parse(storage.getItem('ironCrownSave')).version,12);

const v10={version:10,state:{current:'greyhaven',gold:55,troops:11,day:6,lastCompanionPayDay:5,characterRoster:{version:2,campaignId:'v10-campaign',nextCharacterSequence:1,nextEventSequence:2,characters:[]},activePartyIds:[],resolvedBattleIds:['battle-v10'],resolvedCampaignEventIds:['ic:v10-campaign:event:1']}};
storage.setItem('ironCrownSave',JSON.stringify(v10));
const v10State=context.window.IronCrownState.createInitialState();
const v10System=makeSystem(v10State);
assert.strictEqual(v10System.load(),true,'v10 saves migrate to v12');
assert.strictEqual(v10State.lastCompanionPayDay,5,'v10 daily payment state is preserved');
assert.deepStrictEqual(JSON.parse(JSON.stringify(v10State.resolvedCampaignEventIds)),['ic:v10-campaign:event:1']);
assert.strictEqual(JSON.parse(storage.getItem('ironCrownSave')).version,12);
const v11={version:11,state:{current:'greyhaven',gold:77,troops:9,day:8,lastCompanionPayDay:7,characterRoster:{version:2,campaignId:'v11-campaign',nextCharacterSequence:1,nextEventSequence:1,characters:[]},activePartyIds:[],resolvedBattleIds:[],resolvedCampaignEventIds:[]}};
storage.setItem('ironCrownSave',JSON.stringify(v11));
const v11State=context.window.IronCrownState.createInitialState(),v11System=makeSystem(v11State);
assert.strictEqual(v11System.load(),true,'v11 saves migrate to v12');assert.strictEqual(v11State.gold,77);assert.strictEqual(v11State.lastCompanionPayDay,7);assert.strictEqual(v11State.resourceStock['greyhaven-grain'],24);assert.strictEqual(v11State.rawMaterials.grain,0);assert.strictEqual(JSON.parse(storage.getItem('ironCrownSave')).version,12);
const malformed=JSON.parse(storage.getItem('ironCrownSave'));malformed.state.resourceStock['greyhaven-grain']=999;malformed.state.resourceStock.unknown=10;malformed.state.rawMaterials.grain=150;malformed.state.rawMaterials.unknown=4;storage.setItem('ironCrownSave',JSON.stringify(malformed));
const safeState=context.window.IronCrownState.createInitialState(),safeSystem=makeSystem(safeState);
assert.strictEqual(safeSystem.load(),true,'invalid resource fields are sanitised without discarding the campaign');assert.strictEqual(safeState.resourceStock['greyhaven-grain'],24);assert.strictEqual(safeState.rawMaterials.grain,99);assert.strictEqual(Object.hasOwn(safeState.resourceStock,'unknown'),false);assert.strictEqual(Object.hasOwn(safeState.rawMaterials,'unknown'),false);
const newer={version:13,state:{current:'greyhaven'}};
storage.setItem('ironCrownSave',JSON.stringify(newer));
assert.strictEqual(second.load(),false,'newer saves must not be overwritten');
assert.strictEqual(storage.getItem('ironCrownSave'),JSON.stringify(newer));
console.log('campaign save v12 migration, resource persistence, payment-day, checkpoint and event-ledger checks passed');