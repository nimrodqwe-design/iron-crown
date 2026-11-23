(function(root){
'use strict';
const SUPPLY_COST=2,DURATION_MINUTES=60,DAY_MINUTES=1440;
function create(options){
 options=options||{};
 const getState=options.getState,party=options.party,loyalty=options.loyalty;
 const isBattleActive=typeof options.isBattleActive==='function'?options.isBattleActive:()=>false;
 if(typeof getState!=='function'||!party||typeof party.active!=='function'||!loyalty||typeof loyalty.record!=='function')throw new TypeError('Campaign state, party and loyalty services are required');
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
  return {ok:true,participantIds};
 }
 function train(){
  const state=getState(),ready=availability();
  if(!ready.ok)return ready;
  const result=loyalty.record('troops:training',ready.participantIds);
  if(!result||!result.ok||result.duplicate)return {ok:false,reason:result&&result.reason?result.reason:'The training event was not applied.'};
  state.supplies-=SUPPLY_COST;
  const elapsed=(Number.isFinite(state.minutes)?Math.max(0,Math.floor(state.minutes)):0)+DURATION_MINUTES;
  const days=Math.floor(elapsed/DAY_MINUTES);
  state.minutes=elapsed%DAY_MINUTES;
  state.day=(Number.isFinite(state.day)?Math.max(1,Math.floor(state.day)):1)+days;
  return {ok:true,participantIds:ready.participantIds.slice(),suppliesSpent:SUPPLY_COST,minutesSpent:DURATION_MINUTES,day:state.day,minutes:state.minutes,loyalty:result};
 }
 return Object.freeze({availability,train,SUPPLY_COST,DURATION_MINUTES});
}
root.IronCrownCampaignTraining=Object.freeze({create,SUPPLY_COST,DURATION_MINUTES});
})(window);
