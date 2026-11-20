(function(root){
'use strict';
const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number.isFinite(value)?value:min));
function create(options){
 options=options||{};
 const simulation=options.simulation,roster=options.roster,party=options.party;
 const getState=options.getState,save=typeof options.save==='function'?options.save:()=>{};
 if(!simulation||typeof simulation.start!=='function'||typeof simulation.step!=='function')throw new TypeError('A battle simulation is required');
 if(!roster||typeof roster.list!=='function'||typeof roster.createEventId!=='function')throw new TypeError('A campaign character roster is required');
 if(!party||typeof party.active!=='function'||typeof party.remove!=='function')throw new TypeError('A campaign party manager is required');
 if(typeof getState!=='function')throw new TypeError('Campaign state access is required');
 let pending=null;
 function start(enemy,hero){
  if(simulation.active())return {ok:false,reason:'A battle is already active'};
  if(!enemy||typeof enemy.id!=='string'||!enemy.id)return {ok:false,reason:'A valid enemy party is required'};
  const state=getState();
  const characters=party.active().filter(character=>character.status!=='recovering');
  const participantIds=characters.map(character=>character.id);
  const friendly=characters.map((character,index)=>({
   id:'named-party-'+index,characterId:character.id,name:character.name,type:'named',count:1,
   hp:Math.round(46+character.morale*.12),
   attack:character.role==='officer'?10:character.role==='companion'?9:7,
   defence:character.role==='officer'?3:2,
   speed:character.role==='specialist'?58:66,
   morale:character.morale
  }));
  if(Number.isFinite(state.troops)&&state.troops>0){
   friendly.push({id:'campaign-foot',type:'foot',count:Math.max(0,Math.floor(state.troops)),hp:58,attack:9,defence:1,speed:65,morale:75});
  }
  const power=Math.max(1,Math.floor(Number(enemy.power)||1));
  const battleId=roster.createEventId();
  try{
   simulation.start({
    battleId,participantIds,friendly,
    enemy:[{id:'enemy-'+enemy.id,type:'raider',count:Math.min(12,power),hp:42+Math.min(12,power),attack:6+Math.floor(power/6),defence:1,speed:58+Math.min(12,power),morale:75}],
    hero:hero||{id:'campaign-hero',name:'Commander',hp:state.health,maxHp:100,attack:12,defence:2,speed:170},
    terrain:enemy.terrain||'plains',
    morale:{friendly:characters.length?78:72,enemy:76}
   });
  }catch(error){return {ok:false,reason:error&&error.message?error.message:'Battle could not start'};}
  pending={battleId,enemyId:enemy.id,enemyName:String(enemy.name||enemy.id),participantIds:participantIds.slice(),initialTroops:state.troops};
  save();
  return {ok:true,battleId,participantIds:participantIds.slice()};
 }
 function applyResult(result){
  if(!result||typeof result.battleId!=='string')return {ok:false,reason:'A valid battle result is required'};
  const state=getState();
  const resolved=Array.isArray(state.resolvedBattleIds)?state.resolvedBattleIds:[];
  if(resolved.includes(result.battleId))return {ok:true,duplicate:true,result};
  if(!pending||result.battleId!==pending.battleId)return {ok:false,reason:'Battle result does not match the active campaign encounter'};
  const resultIds=Array.isArray(result.participantIds)?result.participantIds:[];
  if(resultIds.length!==pending.participantIds.length||pending.participantIds.some(id=>!resultIds.includes(id)))
   return {ok:false,reason:'Battle participant identities do not match the campaign party'};
  const foot=Number.isFinite(result.survivors&&result.survivors.friendly&&result.survivors.friendly.foot)?result.survivors.friendly.foot:0;
  state.troops=clamp(Math.floor(foot),0,9999);
  state.health=clamp(Math.round(result.hero&&result.hero.hp),10,100);
  if(result.outcome==='victory'){
   const reward=result.rewards&&Number.isFinite(result.rewards.gold)?Math.max(0,Math.floor(result.rewards.gold)):0;
   state.gold=clamp(Math.floor(Number(state.gold)||0)+reward,0,999999);
   if(!Array.isArray(state.defeatedParties))state.defeatedParties=[];
   if(!state.defeatedParties.includes(pending.enemyId))state.defeatedParties.push(pending.enemyId);
  }
  const outcomes=new Map((Array.isArray(result.characterOutcomes)?result.characterOutcomes:[]).map(item=>[item.characterId,item]));
  let loyaltyService=null;
  if(pending.participantIds.length&&root.IronCrownLoyalty&&root.IronCrownCampaignLoyaltyAdapter){
   loyaltyService=root.IronCrownLoyalty.create({recruits:roster.list()});
   const adapter=root.IronCrownCampaignLoyaltyAdapter.create({loyalty:loyaltyService});
   adapter.applyBattleResult({battleId:result.battleId,outcome:result.outcome==='victory'?'victory':'defeat',participantIds:pending.participantIds});
  }
  pending.participantIds.forEach(id=>{
   const character=roster.get(id);
   if(!character)return;
   const patch={};
   const standing=loyaltyService&&loyaltyService.getStanding(id);
   if(standing){patch.trust=standing.trust;patch.morale=standing.morale}
   const outcome=outcomes.get(id);
   if(outcome&&!outcome.alive){patch.status='recovering';party.remove(id)}
   if(Object.keys(patch).length&&typeof roster.update==='function')roster.update(id,patch);
  });
  state.resolvedBattleIds=[...new Set([...resolved,result.battleId])].slice(-200);
  save();
  pending=null;
  return {ok:true,duplicate:false,result};
 }
 function step(delta){
  if(!pending||!simulation.active())return simulation.snapshot();
  const snapshot=simulation.step(delta);
  if(!simulation.active()){
   const result=simulation.getResult();
   if(result)applyResult(result);
  }
  return snapshot;
 }
 function setPlayerInput(input){
  if(!pending||!simulation.active())return false;
  return simulation.setPlayerInput({...input,battleId:pending.battleId});
 }
 function issueOrder(order){
  if(!pending||!simulation.active())return false;
  return simulation.issueOrder({battleId:pending.battleId,order});
 }
 function autoResolve(options){
  if(!pending||!simulation.active())return {ok:false,reason:'No active campaign battle'};
  options=options||{};
  const maxSteps=Number.isInteger(options.maxSteps)?Math.max(1,Math.min(12000,options.maxSteps)):5000;
  let steps=0;
  simulation.issueOrder({battleId:pending.battleId,order:'advance'});
  while(simulation.active()&&steps<maxSteps){
   const snapshot=simulation.snapshot();
   const hero=snapshot&&snapshot.hero;
   const targets=snapshot&&Array.isArray(snapshot.enemy)?snapshot.enemy.filter(unit=>unit.hp>0):[];
   if(hero&&targets.length){
    let target=targets[0],distance=Infinity;
    targets.forEach(unit=>{const d=Math.hypot(unit.x-hero.x,unit.y-hero.y);if(d<distance){distance=d;target=unit}});
    const dx=target.x-hero.x,dy=target.y-hero.y,mag=Math.hypot(dx,dy)||1;
    const moving=distance>54;
    simulation.setPlayerInput({battleId:pending.battleId,moveX:moving?dx/mag:0,moveY:moving?dy/mag:0,facingX:dx/mag,facingY:dy/mag,attack:distance<=76});
   }
   simulation.step(.05);
   steps++;
  }
  if(simulation.active())simulation.retreat();
  return applyResult(simulation.getResult());
 }
 function retreat(){
  if(!pending||!simulation.active())return {ok:false,reason:'No active campaign battle'};
  simulation.retreat();
  return applyResult(simulation.getResult());
 }
 function serialize(){
  if(!pending||!simulation.active()||typeof simulation.serialize!=='function')return null;
  const savedSimulation=simulation.serialize();
  if(!savedSimulation)return null;
  return {version:1,pending:{battleId:pending.battleId,enemyId:pending.enemyId,enemyName:pending.enemyName,participantIds:pending.participantIds.slice(),initialTroops:pending.initialTroops},simulation:savedSimulation};
 }
 function restore(saved){
  if(pending||simulation.active()||!saved||saved.version!==1||!saved.pending||!saved.simulation||typeof simulation.restore!=='function')return false;
  const data=saved.pending,ids=Array.isArray(data.participantIds)?data.participantIds:[];
  if(typeof data.battleId!=='string'||!data.battleId||typeof data.enemyId!=='string'||!data.enemyId||
   typeof data.enemyName!=='string'||!Number.isFinite(data.initialTroops)||data.initialTroops<0||data.initialTroops>9999||
   ids.length>4||ids.some(id=>typeof id!=='string'||!id)||new Set(ids).size!==ids.length)return false;
  const state=getState();
  if((Array.isArray(state.defeatedParties)?state.defeatedParties:[]).includes(data.enemyId))return false;
  const knownIds=new Set(roster.list().map(character=>character.id));
  if(ids.some(id=>!knownIds.has(id)))return false;
  const activeIds=party.active().map(character=>character.id);
  if(activeIds.length!==ids.length||activeIds.some((id,index)=>id!==ids[index]))return false;
  const savedBattle=saved.simulation.battle;
  if(!savedBattle||savedBattle.battleId!==data.battleId||!Array.isArray(savedBattle.participantIds)||
   savedBattle.participantIds.length!==ids.length||savedBattle.participantIds.some((id,index)=>id!==ids[index]))return false;
  if(!simulation.restore(saved.simulation))return false;
  pending={battleId:data.battleId,enemyId:data.enemyId,enemyName:data.enemyName,participantIds:ids.slice(),initialTroops:Math.floor(data.initialTroops)};
  return true;
 }
 function recoverAtCamp(){
  const recovered=[];
  roster.list().filter(character=>character.status==='recovering').forEach(character=>{
   const updated=roster.update(character.id,{status:'available',morale:Math.min(100,character.morale+10)});
   if(updated)recovered.push(updated);
  });
  return recovered;
 }
 return Object.freeze({start,applyResult,step,setPlayerInput,issueOrder,autoResolve,retreat,recoverAtCamp,serialize,restore,active:()=>simulation.active(),snapshot:()=>simulation.snapshot(),getResult:()=>simulation.getResult(),getPending:()=>pending?{...pending,participantIds:pending.participantIds.slice()}:null});
}
root.IronCrownCampaignBattle=Object.freeze({create});
})(window);
