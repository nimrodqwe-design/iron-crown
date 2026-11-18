'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context={window:{crypto:{randomUUID:()=> 'party-test'}}};
vm.createContext(context);
for(const file of ['js/characters/campaign-roster.js','js/characters/party.js']){
 vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
}
const roster=context.window.IronCrownCharacters.create({campaignId:'party-test'});
const mara=roster.add({name:'Mara',role:'companion'});
const iven=roster.add({name:'Iven',role:'officer'});
const sella=roster.add({name:'Sella',role:'specialist'});
let activePartyIds=[];
const party=context.window.IronCrownParty.create({
 roster,
 getActiveIds:()=>activePartyIds,
 setActiveIds:ids=>{activePartyIds=ids;},
 maxSize:2
});
assert.equal(party.maxSize,2);
assert.equal(party.assign(mara.id).ok,true);
assert.equal(party.assign(iven.id).ok,true);
assert.equal(party.assign(mara.id).ok,false,'a character cannot be assigned twice');
assert.equal(party.assign(sella.id).reason,'The active party is full');
assert.equal(party.assign('ic:party-test:character:99').ok,false,'unknown IDs cannot be assigned');
assert.deepEqual(JSON.parse(JSON.stringify(party.active().map(character=>character.id))),[mara.id,iven.id]);
assert.equal(party.remove(mara.id).ok,true);
assert.equal(party.assign(sella.id).ok,true,'a freed slot can be reused');
assert.deepEqual(JSON.parse(JSON.stringify(party.active().map(character=>character.id))),[iven.id,sella.id]);
activePartyIds=[iven.id,iven.id,'unknown',mara.id,sella.id];
assert.deepEqual(JSON.parse(JSON.stringify(party.active().map(character=>character.id))),[iven.id,mara.id],'hydration removes duplicates and unknown IDs and respects capacity');
assert.deepEqual(JSON.parse(JSON.stringify(activePartyIds)),[iven.id,mara.id]);
console.log('campaign party checks passed');
