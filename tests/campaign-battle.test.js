'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context={window:{crypto:{randomUUID:()=> 'battle-campaign'}}};
vm.createContext(context);
for(const file of [
 'js/characters/campaign-roster.js',
 'js/characters/party.js',
 'js/characters/loyalty.js',
 'js/characters/campaign-loyalty-adapter.js',
 'js/battle/battle-simulation.js'
])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
vm.runInContext(fs.readFileSync('js/characters/campaign-battle.js','utf8'),context,{filename:'js/characters/campaign-battle.js'});
const roster=context.window.IronCrownCharacters.create({campaignId:'battle-test'});
const mara=roster.add({name:'Mara',role:'companion',motivation:'glory',trust:50,morale:60});
const party=context.window.IronCrownParty.create({roster,getActiveIds:()=>state.activePartyIds,setActiveIds:ids=>{state.activePartyIds=ids}});
const state={troops:8,health:100,gold:20,defeatedParties:[],resolvedBattleIds:[],activePartyIds:[]};
assert.equal(party.assign(mara.id).ok,true);
let saves=0;
const simulation=context.window.IronCrownBattleSimulation.create();
const campaign=context.window.IronCrownCampaignBattle.create({simulation,roster,party,getState:()=>state,save:()=>{saves++}});
const started=campaign.start({id:'red-bandits',name:'Redvale Raiders',power:4},{id:'hero',name:'Commander',hp:100,maxHp:100,attack:30,defence:4,speed:200});
assert.equal(started.ok,true);
assert.deepEqual(JSON.parse(JSON.stringify(started.participantIds)),[mara.id]);
assert.equal(campaign.active(),true);
assert.equal(saves,1,'battle ID sequence is saved when the encounter starts');
const resolved=campaign.autoResolve();
assert.equal(resolved.ok,true);
assert.ok(resolved.result);
assert.ok(['victory','defeat'].includes(resolved.result.outcome));
assert.ok(state.troops>=0&&state.troops<=8,'generic troop totals remain bounded by the starting count');
assert.ok(state.health>=10&&state.health<=100);
assert.ok(state.resolvedBattleIds.includes(started.battleId),'resolved battle ID is persisted in campaign state');
assert.equal(saves,2,'campaign result is saved exactly once');
const standing=roster.get(mara.id);
assert.ok(standing.trust!==50||standing.morale!==60,'battle outcome changes participant loyalty');
const duplicate=campaign.applyResult(resolved.result);
assert.equal(duplicate.ok,true);
assert.equal(duplicate.duplicate,true,'a repeated result cannot apply campaign rewards or casualties twice');
assert.equal(saves,2);
assert.equal(state.defeatedParties.includes('red-bandits'),resolved.result.outcome==='victory');
party.remove(mara.id);
roster.update(mara.id,{status:'recovering',morale:40});
const recovered=campaign.recoverAtCamp();
assert.equal(recovered.length,1,'camp recovery returns wounded named characters');
assert.equal(roster.get(mara.id).status,'available');
assert.equal(roster.get(mara.id).morale,50,'camp recovery restores morale by ten points');
assert.equal(party.assign(mara.id).ok,true,'recovered characters can rejoin the active party');
const manualState={troops:5,health:100,gold:0,defeatedParties:[],resolvedBattleIds:[],activePartyIds:[]};
const manualRoster=context.window.IronCrownCharacters.create({campaignId:'manual-battle-test'});
const manualParty=context.window.IronCrownParty.create({roster:manualRoster,getActiveIds:()=>manualState.activePartyIds,setActiveIds:ids=>{manualState.activePartyIds=ids}});
const manualSimulation=context.window.IronCrownBattleSimulation.create();
const manualCampaign=context.window.IronCrownCampaignBattle.create({simulation:manualSimulation,roster:manualRoster,party:manualParty,getState:()=>manualState,save:()=>{}});
const manualStart=manualCampaign.start({id:'manual-raiders',name:'Manual Raiders',power:2},{id:'hero',name:'Commander',hp:100,maxHp:100,attack:20,defence:3,speed:170});
assert.equal(manualStart.ok,true);
const beforeMove=manualCampaign.snapshot().hero.x;
assert.equal(manualCampaign.issueOrder('hold'),true,'player can issue a valid battlefield order');
assert.equal(manualCampaign.issueOrder('charge'),false,'unsupported battlefield orders are rejected');
assert.equal(manualCampaign.setPlayerInput({moveX:1,moveY:0,facingX:1,facingY:0}),true,'player input is scoped to the active campaign battle');
const moved=manualCampaign.step(.05);
assert.ok(moved.hero.x>beforeMove,'campaign controller advances the authoritative simulation');
assert.equal(moved.order,'hold');
const manualRetreat=manualCampaign.retreat();
assert.equal(manualRetreat.ok,true);
assert.equal(manualRetreat.result.reason,'retreated');
assert.equal(manualCampaign.active(),false);
assert.equal(manualCampaign.getResult().battleId,manualStart.battleId);
assert.ok(manualState.resolvedBattleIds.includes(manualStart.battleId),'manual retreat applies and persists the battle result');
assert.equal(manualCampaign.step(.05).phase,'ended','completed battles do not advance again');

console.log('Campaign battle integration checks passed');
