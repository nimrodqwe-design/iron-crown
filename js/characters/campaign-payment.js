(function(root){
'use strict';
const COST_PER_COMPANION=5;
function create(options){
 options=options||{};
 const getState=options.getState,party=options.party,loyalty=options.loyalty;
 const isBattleActive=typeof options.isBattleActive==='function'?options.isBattleActive:()=>false;
 if(typeof getState!=='function'||!party||typeof party.active!=='function'||!loyalty||typeof loyalty.record!=='function')
  throw new TypeError('Campaign state, party and loyalty services are required');
 function availability(){
  const state=getState();
  if(!state)return {ok:false,reason:'Campaign state is unavailable.'};
  if(state.target)return {ok:false,reason:'Companion pay is unavailable while travelling.'};
  if(isBattleActive())return {ok:false,reason:'Companion pay is unavailable during battle.'};
  const day=Number.isSafeInteger(state.day)&&state.day>0?state.day:null;
  if(day===null)return {ok:false,reason:'The campaign day is invalid.'};
  const lastPaid=Number.isSafeInteger(state.lastCompanionPayDay)&&state.lastCompanionPayDay>=0?state.lastCompanionPayDay:0;
  if(lastPaid>=day)return {ok:false,reason:'The active companions have already been paid today.'};
  const active=party.active();
  if(!Array.isArray(active)||!active.length)return {ok:false,reason:'Assign at least one named companion before paying the company.'};
  const participantIds=active.map(character=>character&&character.id);
  if(participantIds.some(id=>typeof id!=='string'||!id)||new Set(participantIds).size!==participantIds.length)
   return {ok:false,reason:'The active party contains an invalid character identity.'};
  const cost=participantIds.length*COST_PER_COMPANION;
  if(!Number.isFinite(state.gold)||state.gold<cost)
   return {ok:false,reason:'Daily wages require '+cost+' gold for the active party.'};
  return {ok:true,participantIds,cost,day};
 }
 function pay(){
  const ready=availability();
  if(!ready.ok)return ready;
  const result=loyalty.record('troops:paid',ready.participantIds);
  if(!result||!result.ok||result.duplicate)
   return {ok:false,reason:result&&result.reason?result.reason:'The payment event was not applied.'};
  const state=getState();
  state.gold-=ready.cost;
  state.lastCompanionPayDay=ready.day;
  return {ok:true,participantIds:ready.participantIds.slice(),goldSpent:ready.cost,day:ready.day,loyalty:result};
 }
 return Object.freeze({availability,pay,COST_PER_COMPANION});
}
root.IronCrownCampaignPayment=Object.freeze({create,COST_PER_COMPANION});
})(window);
