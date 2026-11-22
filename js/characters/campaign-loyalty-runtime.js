(function(root){
'use strict';
const MAX_EVENT_HISTORY=200;
function create(options){
 options=options||{};
 const roster=options.roster;
 const getResolved=options.getResolvedEventIds;
 const setResolved=options.setResolvedEventIds;
 const loyaltyApi=root.IronCrownLoyalty;
 const adapterApi=root.IronCrownCampaignLoyaltyAdapter;
 if(!roster||typeof roster.list!=='function'||typeof roster.update!=='function'||typeof roster.createEventId!=='function'||typeof roster.getCampaignId!=='function')
  throw new TypeError('A persistent campaign roster is required');
 if(!loyaltyApi||typeof loyaltyApi.create!=='function'||!adapterApi||typeof adapterApi.create!=='function')
  throw new TypeError('Campaign loyalty services must be loaded first');
 if(typeof getResolved!=='function'||typeof setResolved!=='function')
  throw new TypeError('Campaign event-ledger accessors are required');
 const campaignId=roster.getCampaignId();
 const prefix='ic:'+campaignId+':event:';
 const validEventId=id=>typeof id==='string'&&id.startsWith(prefix)&&/^[1-9][0-9]*$/.test(id.slice(prefix.length));
 function ledger(){
  const source=getResolved();
  return Array.isArray(source)?[...new Set(source.filter(validEventId))].slice(-MAX_EVENT_HISTORY):[];
 }
 function normaliseIds(source){
  return Array.isArray(source)?[...new Set(source.filter(id=>typeof id==='string'&&id))]:[];
 }
 function apply(input){
  if(!input||!validEventId(input.eventId))return {ok:false,reason:'A valid campaign event ID is required'};
  const resolved=ledger();
  if(resolved.includes(input.eventId))return {ok:true,duplicate:true,eventId:input.eventId,results:[]};
  if(!adapterApi.EVENT_ACTIONS[input.type])return {ok:false,reason:'Unsupported campaign event type'};
  const ids=normaliseIds(input.recruitIds);
  if(!ids.length)return {ok:false,reason:'At least one named participant is required'};
  const characters=roster.list();
  const known=new Set(characters.map(character=>character.id));
  if(ids.some(id=>!known.has(id)))return {ok:false,reason:'A campaign event referenced an unknown character'};
  const loyalty=loyaltyApi.create({recruits:characters});
  const adapter=adapterApi.create({loyalty});
  const result=adapter.apply({type:input.type,eventId:input.eventId,recruitIds:ids});
  if(!result.ok)return result;
  if(result.results.some(item=>!item.ok||!item.standing))return {ok:false,reason:'The loyalty adapter could not update every participant'};
  result.results.forEach(item=>{roster.update(item.id,{trust:item.standing.trust,morale:item.standing.morale})});
  setResolved([...resolved,input.eventId].slice(-MAX_EVENT_HISTORY));
  return {...result,eventId:input.eventId,duplicate:false};
 }
 function record(type,recruitIds){
  if(!adapterApi.EVENT_ACTIONS[type])return {ok:false,reason:'Unsupported campaign event type'};
  const ids=normaliseIds(recruitIds);
  if(!ids.length)return {ok:false,reason:'No named participants were present for this campaign event'};
  const known=new Set(roster.list().map(character=>character.id));
  if(ids.some(id=>!known.has(id)))return {ok:false,reason:'A campaign event referenced an unknown character'};
  const eventId=roster.createEventId();
  return apply({type,eventId,recruitIds:ids});
 }
 return Object.freeze({apply,record,isResolved:eventId=>ledger().includes(eventId),snapshot:()=>ledger()});
}
root.IronCrownCampaignLoyaltyRuntime=Object.freeze({create});
})(window);
