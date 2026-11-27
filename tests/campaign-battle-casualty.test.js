'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context={window:{crypto:{randomUUID:()=>'casualty-recovery-test'}}};
vm.createContext(context);
for(const file of [
 'js/characters/campaign-roster.js',
 'js/characters/party.js',
 'js/characters/loyalty.js',
 'js/characters/campaign-loyalty-adapter.js',
 'js/battle/battle-simulation.js',
 'js/characters/campaign-battle.js'
])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});

const state={troops:0,health:100,gold:0,defeatedParties:[],resolvedBattleIds:[],activePartyIds:[]};
const roster=context.window.IronCrownCharacters.create({campaignId:'casualty-recovery'});
const mara=roster.add({name:'Mara Venn',role:'companion',motivation:'glory',trust:50,morale:0});
const party=context.window.IronCrownParty.create({
 roster,
 getActiveIds:()=>state.activePartyIds,
 setActiveIds:ids=>{state.activePartyIds=ids}
});
assert.equal(party.assign(mara.id).ok,true,'the named companion joins the active party');

let saves=0;
const simulation=context.window.IronCrownBattleSimulation.create();
const campaign=context.window.IronCrownCampaignBattle.create({
 simulation,roster,party,getState:()=>state,save:()=>{saves++}
});
const started=campaign.start(
 {id:'red-bandits',name:'Redvale Raiders',power:8},
 {id:'campaign-hero',name:'Commander',hp:100,maxHp:100,attack:1,defence:0,speed:400}
);
assert.equal(started.ok,true,'the campaign opens the deterministic hostile encounter');
assert.deepEqual(JSON.parse(JSON.stringify(started.participantIds)),[mara.id]);
assert.equal(saves,1,'the pending battle ID is saved before combat advances');

campaign.setPlayerInput({moveX:1,moveY:1,facingX:1,facingY:1});
let steps=0;
while(campaign.active()&&steps<1000){
 campaign.step(.05);
 steps++;
}
assert.ok(steps<1000,'the deterministic battle reaches a terminal result');
const result=campaign.getResult();
assert.ok(result,'the campaign retains the terminal simulation result');
assert.equal(result.outcome,'defeat');
assert.equal(result.reason,'warband-routed');
assert.equal(result.casualties.friendly,1);
assert.deepEqual(JSON.parse(JSON.stringify(result.characterOutcomes)),[
 {characterId:mara.id,alive:false,hp:0,maxHp:46}
],'the simulation reports the exact named companion casualty');
assert.equal(roster.get(mara.id).status,'recovering','campaign result marks the casualty as recovering');
assert.equal(party.active().length,0,'the casualty is removed from the active party');
assert.deepEqual(JSON.parse(JSON.stringify(state.activePartyIds)),[],'the persisted party ID list is updated');
assert.deepEqual(JSON.parse(JSON.stringify(state.resolvedBattleIds)),[started.battleId],'the result is recorded once');
assert.equal(saves,2,'battle start and result each save once');

const duplicate=campaign.applyResult(result);
assert.equal(duplicate.ok,true);
assert.equal(duplicate.duplicate,true,'replaying the same result cannot apply the casualty twice');
assert.equal(saves,2,'duplicate result application does not save or mutate again');

const restoredState=JSON.parse(JSON.stringify(state));
const restoredRoster=context.window.IronCrownCharacters.restore(JSON.parse(JSON.stringify(roster.snapshot())));
const restoredParty=context.window.IronCrownParty.create({
 roster:restoredRoster,
 getActiveIds:()=>restoredState.activePartyIds,
 setActiveIds:ids=>{restoredState.activePartyIds=ids}
});
const restoredCampaign=context.window.IronCrownCampaignBattle.create({
 simulation:context.window.IronCrownBattleSimulation.create(),
 roster:restoredRoster,party:restoredParty,getState:()=>restoredState,save:()=>{}
});
assert.equal(restoredRoster.get(mara.id).status,'recovering','the casualty status survives roster snapshot/restore');
assert.deepEqual(JSON.parse(JSON.stringify(restoredState.resolvedBattleIds)),[started.battleId],'the battle replay ledger survives state persistence');
const recovered=restoredCampaign.recoverAtCamp();
assert.equal(recovered.length,1,'camp recovery restores the casualty once');
assert.equal(restoredRoster.get(mara.id).status,'available');
assert.equal(restoredRoster.get(mara.id).morale,10);
assert.equal(restoredParty.assign(mara.id).ok,true,'the recovered companion can rejoin the active party');
assert.deepEqual(JSON.parse(JSON.stringify(restoredState.activePartyIds)),[mara.id]);

console.log('Campaign battle casualty → recovery → reassignment checks passed');
