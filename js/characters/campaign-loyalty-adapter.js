(function(root){
'use strict';
const ACTIONS=Object.freeze({
 'troops:paid':'paid',
 'troops:unpaid':'unpaid',
 'troops:protected':'protected',
 'troops:abandoned':'abandoned',
 'troops:promise-kept':'kept_promise',
 'troops:promise-broken':'broken_promise',
 'troops:training':'training',
 'troops:discovery':'discovery',
 'troops:reckless-order':'reckless_order',
 'troops:safe-retreat':'retreated_safely',
 'troops:avenged':'avenged'
});
function create(options){
 options=options||{};
 const loyalty=options.loyalty;
 if(!loyalty||typeof loyalty.recordAction!=='function'||typeof loyalty.getStanding!=='function')
  throw new TypeError('A compatible IronCrownLoyalty instance is required');
 const onChronicle=typeof options.onChronicle==='function'?options.onChronicle:null;
 function apply(input){
  if(!input||typeof input.eventId!=='string'||!input.eventId) return {ok:false,reason:'A stable eventId is required'};
  const action=ACTIONS[input.type];
  if(!action)return {ok:false,reason:'Unsupported campaign event type'};
  if(!Array.isArray(input.recruitIds)||!input.recruitIds.length)return {ok:false,reason:'At least one recruitId is required'};
  const results=[];
  input.recruitIds.forEach(id=>{
   if(typeof id!=='string'||!id)return;
   const before=loyalty.getStanding(id);
   const result=loyalty.recordAction(id,action,input.eventId);
   if(!result.ok){results.push({id,ok:false,reason:result.reason});return}
   const after=loyalty.getStanding(id);
   results.push({id,ok:true,duplicate:!!result.duplicate,standing:after});
   if(!result.duplicate&&before&&after&&before.state!==after.state&&onChronicle){
    onChronicle(Object.freeze({
     type:'recruit:standing-changed',eventId:input.eventId,recruitId:id,
     recruitName:after.name,from:before.state,to:after.state,
     trust:after.trust,morale:after.morale
    }));
   }
  });
  return {ok:true,action,results};
 }
 function applyBattleResult(input){
  if(!input||typeof input.battleId!=='string'||!input.battleId)return {ok:false,reason:'A stable battleId is required'};
  if(!['victory','defeat'].includes(input.outcome))return {ok:false,reason:'Battle outcome must be victory or defeat'};
  if(!Array.isArray(input.participantIds)||!input.participantIds.length)return {ok:false,reason:'Participant IDs are required'};
  return apply({
   type:input.outcome==='victory'?'battle:victory':'battle:defeat',
   eventId:'battle:'+input.battleId+':'+input.outcome,
   recruitIds:input.participantIds
  });
 }
 // Battle result types are deliberately explicit and cannot be confused with ordinary campaign events.
 ACTIONS['battle:victory']='victory';
 ACTIONS['battle:defeat']='defeat';
 return Object.freeze({apply,applyBattleResult});
}
root.IronCrownCampaignLoyaltyAdapter=Object.freeze({create,EVENT_ACTIONS:ACTIONS});
})(window);
