(function(){
'use strict';
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number.isFinite(n)?n:min));
const ACTIONS=Object.freeze({
 paid:{trust:2,morale:5},
 unpaid:{trust:-5,morale:-9},
 protected:{trust:5,morale:4},
 abandoned:{trust:-12,morale:-16},
 victory:{trust:2,morale:7},
 defeat:{trust:0,morale:-6},
 kept_promise:{trust:7,morale:3},
 broken_promise:{trust:-10,morale:-8},
 training:{trust:1,morale:2},
 discovery:{trust:1,morale:3},
 reckless_order:{trust:-3,morale:-7},
 retreated_safely:{trust:2,morale:-1},
 avenged:{trust:4,morale:6}
});
const MOTIVE_BONUS={
 coin:{paid:[2,5],unpaid:[-4,-8]},
 safety:{protected:[4,4],abandoned:[-5,-8],reckless_order:[-5,-8],retreated_safely:[4,4]},
 glory:{victory:[2,5],defeat:[-1,-5],avenged:[1,4]},
 loyalty:{kept_promise:[5,3],broken_promise:[-6,-5],protected:[2,2]},
 vengeance:{avenged:[7,7],victory:[1,2],broken_promise:[-2,-2]},
 knowledge:{training:[2,4],discovery:[3,5]}
};
function clean(input){
 if(!input||typeof input.id!=='string'||!input.id)throw new TypeError('Recruit requires a stable id');
 const motivation=Object.prototype.hasOwnProperty.call(MOTIVE_BONUS,input.motivation)?input.motivation:'coin';
 return {id:input.id,name:String(input.name||'Unknown recruit'),role:['companion','officer','soldier'].includes(input.role)?input.role:'soldier',motivation,trust:clamp(input.trust??50,0,100),morale:clamp(input.morale??60,0,100),events:[]};
}
function create(options){
 options=options||{};
 const people=new Map();
 (options.recruits||[]).forEach(raw=>{const p=clean(raw);if(people.has(p.id))throw new Error('Duplicate recruit: '+p.id);p.events=Array.isArray(raw.events)?[...new Set(raw.events.filter(x=>typeof x==='string'))].slice(-200):[];people.set(p.id,p)});
 function addRecruit(raw){const p=clean(raw);if(people.has(p.id))return false;people.set(p.id,p);return true}
 function recordAction(id,action,eventId){
  const p=people.get(id);if(!p)return {ok:false,reason:'Unknown recruit'};
  if(!Object.prototype.hasOwnProperty.call(ACTIONS,action))return {ok:false,reason:'Unknown action'};
  if(typeof eventId!=='string'||!eventId)return {ok:false,reason:'A unique event id is required'};
  if(p.events.includes(eventId))return {ok:true,duplicate:true,standing:getStanding(id)};
  const base=ACTIONS[action],bonus=MOTIVE_BONUS[p.motivation][action]||[0,0];
  p.trust=clamp(p.trust+base.trust+bonus[0],0,100);
  p.morale=clamp(p.morale+base.morale+bonus[1],0,100);
  p.events.push(eventId);if(p.events.length>200)p.events.splice(0,p.events.length-200);
  return {ok:true,duplicate:false,trust:p.trust,morale:p.morale,standing:getStanding(id)};
 }
 function getStanding(id){
  const p=people.get(id);if(!p)return null;
  const score=p.trust*.6+p.morale*.4;
  const state=score>=75?'loyal':score>=50?'steady':score>=30?'wavering':'discontented';
  return {id:p.id,name:p.name,role:p.role,motivation:p.motivation,trust:p.trust,morale:p.morale,score:Math.round(score),state,needsAttention:state==='wavering'||state==='discontented'};
 }
 function list(){return [...people.keys()].map(getStanding)}
 function snapshot(){return {version:1,recruits:[...people.values()].map(p=>({...p,events:[...p.events]}))}}
 return Object.freeze({addRecruit,recordAction,getStanding,list,snapshot});
}
window.IronCrownLoyalty=Object.freeze({create,ACTIONS});
})();