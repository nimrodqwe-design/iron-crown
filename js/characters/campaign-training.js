(function(root){
'use strict';
const SUPPLY_COST=2,DURATION_MINUTES=60;
function create(options){
 options=options||{};
 const getState=options.getState,party=options.party,loyalty=options.loyalty;
 const timeApi=options.time||root.IronCrownCampaignTime;
 const isBattleActive=typeof options.isBattleActive==='function'?options.isBattleActive:()=>false;
 if(typeof getState!=='function'||!party||typeof party.active!=='function'||!loyalty||typeof loyalty.record!=='function'||!timeApi||typeof timeApi.canAdvance!=='function'||typeof timeApi.advance!=='function')throw new TypeError('Campaign state, party, loyalty and time services are required');
 function availability(){
  const state=getState();
  if(!state||!state.camped)return {ok:false,reason:'Establish camp before training.'};
  if(state.target)return {ok:false,reason:'Training is unavailable while travelling.'};
  if(isBattleActive())return {ok:false,reason:'Training is unavailable during battle.'};
  const active=party.active();
  if(!Array.isArray(active)||!active.length)return {ok:false,reason:'Assign at least one named companion to the active party.'};
  const participantIds=active.map(character=>character&&character.id);
  if(participantIds.some(id=>typeof id!=='string'||!id)||new Set(participantIds).size!==participantIds.length)return {ok:false,reason:'The active party contains an invalid character identity.'};
  if(!Number.isFinite(state.supplies)||state.supplies<SUPPLY_COST)return {ok:false,reason:'Training requires 2 supplies.'};
  if(!timeApi.canAdvance(state,DURATION_MINUTES))return {ok:false,reason:'Campaign time is invalid.'};
  return {ok:true,participantIds};
 }
 function train(){
  const state=getState(),ready=availability();
  if(!ready.ok)return ready;
  const stateBefore={day:state.day,minutes:state.minutes};
  const elapsed=timeApi.advance(state,DURATION_MINUTES);
  if(!elapsed.ok)return {ok:false,reason:elapsed.reason||'Campaign time could not advance.'};
  const result=loyalty.record('troops:training',ready.participantIds);
  if(!result||!result.ok||result.duplicate){
   state.day=stateBefore.day;state.minutes=stateBefore.minutes;
   return {ok:false,reason:result&&result.reason?result.reason:'The training event was not applied.'};
  }
  state.supplies-=SUPPLY_COST;
  return {ok:true,participantIds:ready.participantIds.slice(),suppliesSpent:SUPPLY_COST,minutesSpent:DURATION_MINUTES,day:state.day,minutes:state.minutes,loyalty:result};
 }
 return Object.freeze({availability,train,SUPPLY_COST,DURATION_MINUTES});
}
root.IronCrownCampaignTraining=Object.freeze({create,SUPPLY_COST,DURATION_MINUTES});
})(window);
