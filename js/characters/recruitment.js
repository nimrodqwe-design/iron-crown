(function(){
'use strict';
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number.isFinite(n)?n:min));
const MOTIVATIONS=new Set(['coin','safety','glory','loyalty','vengeance','knowledge']);
function cleanCandidate(input){
 if(!input||typeof input.id!=='string'||!input.id)throw new TypeError('Candidate requires a stable id');
 const motivation=MOTIVATIONS.has(input.motivation)?input.motivation:'coin';
 return Object.freeze({
  id:input.id,name:String(input.name||'Unknown recruit'),
  role:['companion','officer','soldier'].includes(input.role)?input.role:'soldier',
  background:String(input.background||'Unknown background'),
  motivation,baseCost:Math.round(clamp(input.baseCost??20,0,999999)),
  trust:clamp(input.trust??25,0,100),
  available:input.available!==false,
  requirements:Object.freeze({...input.requirements})
 });
}
function create(options){
 options=options||{};
 let gold=Math.round(clamp(options.gold??0,0,999999999));
 let reputation=clamp(options.reputation??50,0,100);
 const candidates=new Map();
 const recruited=new Set();
 (options.candidates||[]).forEach(c=>{const candidate=cleanCandidate(c);if(candidates.has(candidate.id))throw new Error('Duplicate candidate: '+candidate.id);candidates.set(candidate.id,candidate)});
 function getCandidate(id){return candidates.get(id)||null}
 function quote(id){
  const c=getCandidate(id);if(!c)return {ok:false,reason:'Unknown recruit'};
  if(!c.available||recruited.has(id))return {ok:false,reason:'This person is no longer available'};
  const req=c.requirements||{};
  if(reputation<clamp(req.minimumReputation??0,0,100))return {ok:false,reason:'Your reputation is not high enough'};
  if(c.trust<clamp(req.minimumTrust??0,0,100))return {ok:false,reason:'This person does not trust you enough yet'};
  const trustFactor=c.trust/100, reputationFactor=reputation/100;
  const confidence=trustFactor*.55+reputationFactor*.45;
  const motivationAdjustment={
   coin:0,
   safety:reputation<35?.18:-.05,
   glory:reputation<45?.12:reputation>=75?-.12:0,
   loyalty:c.trust>=70?-.12:.08,
   vengeance:reputation>=55?-.06:.08,
   knowledge:reputation>=60?-.08:0
  }[c.motivation];
  let multiplier=1.5-(trustFactor*.55)-(reputationFactor*.35)+motivationAdjustment;
  multiplier=clamp(multiplier,.1,1.8);
  const volunteer= c.motivation!=='coin' && c.trust>=85 && reputation>=80 && confidence>=.82;
  const cost=volunteer?0:Math.max(0,Math.ceil(c.baseCost*multiplier));
  return {ok:true,candidate:{id:c.id,name:c.name,role:c.role,background:c.background,motivation:c.motivation,trust:c.trust},cost,volunteer,confidence:Math.round(confidence*100),message:volunteer?'Volunteers freely because of your reputation and their trust.':cost<c.baseCost?'Your reputation and this person’s trust reduce the asking price.':cost>c.baseCost?'They require extra assurance or payment before joining.':'They ask for the usual recruitment payment.'};
 }
 function recruit(id){
  const offer=quote(id);if(!offer.ok)return {...offer,recruited:false};
  if(gold<offer.cost)return {ok:false,recruited:false,reason:'Not enough gold',cost:offer.cost,gold};
  gold-=offer.cost;recruited.add(id);
  return {ok:true,recruited:true,candidate:offer.candidate,cost:offer.cost,volunteer:offer.volunteer,gold};
 }
 function updateTrust(id,delta){
  const c=getCandidate(id);if(!c)return false;
  candidates.set(id,Object.freeze({...c,trust:clamp(c.trust+Number(delta||0),0,100)}));
  return true;
 }
 function updateReputation(value){reputation=clamp(value,0,100);return reputation}
 function snapshot(){
  return {gold,reputation,candidates:[...candidates.values()].map(c=>({...c,requirements:{...c.requirements}})),recruited:[...recruited]};
 }
 return Object.freeze({quote,recruit,updateTrust,updateReputation,snapshot});
}
window.IronCrownRecruitment=Object.freeze({create,MOTIVATIONS:Object.freeze([...MOTIVATIONS])});
})();