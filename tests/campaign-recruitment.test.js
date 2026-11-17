'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context={window:{}};
vm.createContext(context);
for(const file of ['js/characters/campaign-roster.js','js/characters/recruitment.js','js/data/recruits.js','js/characters/campaign-recruitment.js']){
 vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
}
const api=context.window.IronCrownCampaignRecruitment;
const roster=context.window.IronCrownCharacters.create({campaignId:'test-campaign'});
let gold=85;
const campaign=api.create({
 roster,
 candidates:context.window.IronCrownRecruitCandidates,
 getGold:()=>gold,
 setGold:value=>{gold=value;},
 getReputation:()=>50
});
const kingsbridge=campaign.listForSettlement('kingsbridge');
assert.equal(kingsbridge.length,1);
assert.equal(kingsbridge[0].name,'Mara Venn');
assert.equal(kingsbridge[0].recruited,false);
assert.equal(kingsbridge[0].quote.ok,true);
const joined=campaign.recruit('mara-kingsbridge','kingsbridge');
assert.equal(joined.ok,true);
assert.equal(joined.recruited,true);
assert.equal(joined.character.candidateId,'mara-kingsbridge');
assert.equal(joined.character.id,'ic:test-campaign:character:1');
assert.equal(gold,85-joined.cost,'campaign gold is deducted exactly by the quoted cost');
assert.equal(roster.list().length,1);
assert.equal(campaign.recruit('mara-kingsbridge','kingsbridge').ok,false,'a named candidate cannot join twice');
assert.equal(gold,85-joined.cost,'duplicate recruitment must not spend gold');
assert.equal(campaign.listForSettlement('kingsbridge')[0].recruited,true);
assert.equal(campaign.recruit('iven-highcourt','kingsbridge').ok,false,'candidates cannot be recruited from another settlement');
const restored=context.window.IronCrownCharacters.restore(roster.snapshot());
assert.equal(restored.list()[0].candidateId,'mara-kingsbridge','candidate identity survives roster snapshot and restore');
let poorGold=1;
const poorRoster=context.window.IronCrownCharacters.create({campaignId:'poor-campaign'});
const poor=context.window.IronCrownCampaignRecruitment.create({
 roster:poorRoster,
 candidates:context.window.IronCrownRecruitCandidates,
 getGold:()=>poorGold,
 setGold:value=>{poorGold=value;},
 getReputation:()=>50
});
const failed=poor.recruit('mara-kingsbridge','kingsbridge');
assert.equal(failed.ok,false);
assert.equal(failed.reason,'Not enough gold');
assert.equal(poorGold,1,'failed recruitment must not change campaign gold');
assert.equal(poorRoster.list().length,0,'failed recruitment must not add a character');
assert.equal(poor.listForSettlement('kingsbridge')[0].recruited,false);
const specialist=campaign.recruit('sella-silverkeep','silverkeep');
assert.equal(specialist.ok,true,'specialists must be supported by the recruitment service');
assert.equal(specialist.character.role,'specialist');
console.log('Campaign named recruitment checks passed');
