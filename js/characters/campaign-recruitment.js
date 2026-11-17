(function(root){
'use strict';
function create(options){
 options=options||{};
 const roster=options.roster;
 const recruitment=root.IronCrownRecruitment;
 if(!roster||typeof roster.add!=='function'||typeof roster.list!=='function')throw new TypeError('A campaign character roster is required');
 if(!recruitment||typeof recruitment.create!=='function')throw new TypeError('The recruitment service must be loaded first');
 const getGold=typeof options.getGold==='function'?options.getGold:()=>0;
 const setGold=options.setGold;
 if(typeof setGold!=='function')throw new TypeError('A campaign gold setter is required');
 const getReputation=typeof options.getReputation==='function'?options.getReputation:()=>50;
 const candidates=new Map();
 (Array.isArray(options.candidates)?options.candidates:[]).forEach(candidate=>{
  if(!candidate||typeof candidate.id!=='string'||!candidate.id.trim()||typeof candidate.settlementId!=='string'||!candidate.settlementId.trim())throw new TypeError('Each recruit candidate needs an id and settlement');
  if(candidates.has(candidate.id))throw new Error('Duplicate recruit candidate: '+candidate.id);
  candidates.set(candidate.id,Object.freeze({...candidate}));
 });
 function findJoined(candidateId){return roster.list().find(character=>character.candidateId===candidateId)||null;}
 function serviceFor(gold,candidate){
  return recruitment.create({gold,reputation:getReputation(),candidates:[candidate]});
 }
 function quote(candidateId){
  const candidate=candidates.get(candidateId);
  if(!candidate)return {ok:false,reason:'Unknown recruit'};
  if(findJoined(candidateId))return {ok:false,reason:'Already recruited'};
  const gold=Number(getGold());
  if(!Number.isFinite(gold)||gold<0)return {ok:false,reason:'Campaign gold is unavailable'};
  return serviceFor(gold,candidate).quote(candidateId);
 }
 function listForSettlement(settlementId){
  return [...candidates.values()].filter(candidate=>candidate.settlementId===settlementId).map(candidate=>{
   const character=findJoined(candidate.id);
   return {...candidate,recruited:!!character,characterId:character?character.id:null,quote:character?{ok:false,reason:'Already recruited'}:quote(candidate.id)};
  });
 }
 function recruit(candidateId,settlementId){
  const candidate=candidates.get(candidateId);
  if(!candidate)return {ok:false,recruited:false,reason:'Unknown recruit'};
  if(candidate.settlementId!==settlementId)return {ok:false,recruited:false,reason:'This recruit is not available at this settlement'};
  if(findJoined(candidateId))return {ok:false,recruited:false,reason:'This person has already joined your company'};
  const gold=Number(getGold());
  if(!Number.isFinite(gold)||gold<0)return {ok:false,recruited:false,reason:'Campaign gold is unavailable'};
  const result=serviceFor(gold,candidate).recruit(candidateId);
  if(!result.ok)return result;
  let character;
  try{
   character=roster.add({
    candidateId:candidate.id,
    name:candidate.name,
    role:candidate.role,
    background:candidate.background,
    motivation:candidate.motivation,
    trust:candidate.trust,
    morale:60,
    status:'available'
   });
  }catch(_){
   return {ok:false,recruited:false,reason:'The recruit could not be added to the campaign roster'};
  }
  setGold(result.gold);
  return {...result,character};
 }
 return Object.freeze({quote,listForSettlement,recruit});
}
root.IronCrownCampaignRecruitment=Object.freeze({create});
})(window);
