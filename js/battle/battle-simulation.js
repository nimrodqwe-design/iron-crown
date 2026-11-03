(function(root){
'use strict';
const MAX_FIELD_TROOPS=12;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const finite=(value,fallback)=>Number.isFinite(value)?value:fallback;
const copy=value=>JSON.parse(JSON.stringify(value));
function create(options){
 options=options||{};
 const events=options.events||createEventBus();
 let battle=null,nextBattle=1;
 function emit(name,payload){events.emit(name,copy(payload))}
 function createEventBus(){
  const listeners=new Map();
  return Object.freeze({
   on(name,fn){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn);return()=>listeners.get(name)?.delete(fn)},
   off(name,fn){return listeners.get(name)?.delete(fn)||false},
   emit(name,payload){(listeners.get(name)||[]).forEach(fn=>fn(payload))}
  });
 }
 function normalizeHero(source){
  const h=source||{};
  return {id:String(h.id||'campaign-hero'),name:String(h.name||'Commander'),hp:clamp(finite(h.hp,100),0,10000),maxHp:Math.max(1,finite(h.maxHp,100)),attack:clamp(finite(h.attack,12),1,1000),defence:clamp(finite(h.defence,2),0,1000),speed:clamp(finite(h.speed,170),50,400),x:500,y:440,attackCooldown:0,moveX:0,moveY:0,facingX:0,facingY:-1};
 }
 function normalizeRoster(entries,team){
  const result=[];let remaining=MAX_FIELD_TROOPS;
  (Array.isArray(entries)?entries:[]).forEach((entry,index)=>{
   if(remaining<=0)return;
   const count=Math.min(remaining,Math.max(0,Math.floor(finite(entry&&entry.count,0))));
   if(!count)return;
   const type=String(entry.type||'foot');
   const stats={id:String(entry.id||team+'-'+type+'-'+index),type,count,hp:clamp(finite(entry.hp,58),1,1000),attack:clamp(finite(entry.attack,9),1,100),defence:clamp(finite(entry.defence,1),0,100),speed:clamp(finite(entry.speed,65),20,180),morale:clamp(finite(entry.morale,75),0,100)};
   result.push(stats);remaining-=count;
  });
  return result;
 }
 function expand(roster,team){
  const units=[];let index=0;
  roster.forEach(group=>{
   for(let i=0;i<group.count;i++){
    const col=i%4,row=Math.floor(i/4);
    const x=team==='friendly'?350+col*34+row*12:650-col*34-row*12;
    const y=team==='friendly'?420+row*28:180+row*28;
    units.push({id:group.id+'-'+i,type:group.type,team,hp:group.hp,maxHp:group.hp,attack:group.attack,defence:group.defence,speed:group.speed,morale:group.morale,x,y,cooldown:((index++%5)*.11),targetId:null});
   }
  });
  return units;
 }
 function rosterCounts(units){
  const groups={};
  units.forEach(unit=>{if(unit.hp<=0)return;groups[unit.type]=(groups[unit.type]||0)+1});
  return groups;
 }
 function counts(units){return units.reduce((sum,u)=>sum+(u.hp>0?1:0),0)}
 function snapshot(){
  if(!battle)return null;
  return {battleId:battle.battleId,elapsed:battle.elapsed,phase:battle.phase,terrain:battle.terrain,hero:battle.hero,friendly:battle.friendly,enemy:battle.enemy,morale:battle.morale,order:battle.order,remaining:{friendly:counts(battle.friendly),enemy:counts(battle.enemy)}};
 }
 function finish(outcome,reason){
  if(!battle||battle.phase==='ended')return null;
  battle.phase='ended';
  const friendlySurvivors=rosterCounts(battle.friendly),enemySurvivors=rosterCounts(battle.enemy);
  const result={
   battleId:battle.battleId,outcome,reason,
   casualties:{
    friendly:Object.values(battle.friendlyRoster).reduce((sum,n)=>sum+n,0)-counts(battle.friendly),
    enemy:Object.values(battle.enemyRoster).reduce((sum,n)=>sum+n,0)-counts(battle.enemy)
   },
   survivors:{friendly:friendlySurvivors,enemy:enemySurvivors},
   hero:{id:battle.hero.id,hp:Math.max(0,Math.round(battle.hero.hp)),maxHp:battle.hero.maxHp},
   rewards:outcome==='victory'?{gold:Math.max(5,Math.round(counts(battle.enemyInitial)*1.5)),renown:Math.max(1,Math.round(counts(battle.enemyInitial)/3))}:{gold:0,renown:0}
  };
  battle.result=result;emit('battle:ended',result);return copy(result);
 }
 function start(config){
  if(battle&&battle.phase!=='ended')throw new Error('A battle is already active');
  config=config||{};
  const friendlyRoster=normalizeRoster(config.friendly,'friendly'),enemyRoster=normalizeRoster(config.enemy,'enemy');
  const friendly=expand(friendlyRoster,'friendly'),enemy=expand(enemyRoster,'enemy');
  if(!enemy.length)throw new Error('A battle requires at least one enemy soldier');
  const terrain=String(config.terrain||'plains');
  battle={
   battleId:String(config.battleId||'battle-'+nextBattle++),terrain,hero:normalizeHero(config.hero),
   friendly,enemy,friendlyInitial:copy(friendly),enemyInitial:copy(enemy),
   friendlyRoster:friendlyRoster.reduce((a,g)=>{a[g.type]=(a[g.type]||0)+g.count;return a},{}),
   enemyRoster:enemyRoster.reduce((a,g)=>{a[g.type]=(a[g.type]||0)+g.count;return a},{}),
   elapsed:0,phase:'active',order:'advance',morale:{friendly:clamp(finite(config.morale&&config.morale.friendly,80),0,100),enemy:clamp(finite(config.morale&&config.morale.enemy,80),0,100)},
   troopCap:MAX_FIELD_TROOPS,result:null
  };
  emit('battle:started',{battleId:battle.battleId,terrain,hero:battle.hero,friendly:friendlyRoster,enemy:enemyRoster,troopCap:MAX_FIELD_TROOPS,morale:battle.morale,order:battle.order,phase:battle.phase});
  emit('battle:state-updated',snapshot());
  return snapshot();
 }
 function setPlayerInput(input){
  if(!battle||battle.phase!=='active')return false;
  input=input||{};if(input.battleId&&input.battleId!==battle.battleId)return false;
  const h=battle.hero;
  h.moveX=clamp(finite(input.moveX,0),-1,1);h.moveY=clamp(finite(input.moveY,0),-1,1);
  const fx=clamp(finite(input.facingX,h.facingX),-1,1),fy=clamp(finite(input.facingY,h.facingY),-1,1),mag=Math.hypot(fx,fy);
  if(mag>.01){h.facingX=fx/mag;h.facingY=fy/mag}
  if(input.attack)heroAttack();
  emit('battle:player-input',{battleId:battle.battleId,moveX:h.moveX,moveY:h.moveY,facingX:h.facingX,facingY:h.facingY,attack:!!input.attack});
  return true;
 }
 function issueOrder(payload){
  if(!battle||battle.phase!=='active')return false;
  payload=payload||{};if(payload.battleId&&payload.battleId!==battle.battleId)return false;
  if(!['advance','hold','regroup'].includes(payload.order))return false;
  battle.order=payload.order;emit('battle:order-issued',{battleId:battle.battleId,order:battle.order});emit('battle:state-updated',snapshot());return true;
 }
 function nearest(unit,units){
  let best=null,distance=Infinity;
  units.forEach(other=>{if(other.hp<=0)return;const d=Math.hypot(other.x-unit.x,other.y-unit.y);if(d<distance){distance=d;best=other}});
  return best;
 }
 function strike(attacker,target,damage){
  if(!target||target.hp<=0)return false;
  const amount=Math.max(1,damage-target.defence*.35);
  target.hp=Math.max(0,target.hp-amount);
  if(attacker.team==='friendly')battle.morale.enemy=clamp(battle.morale.enemy-(target.hp===0?2.4:.25),0,100);
  else battle.morale.friendly=clamp(battle.morale.friendly-(target.hp===0?2.4:.25),0,100);
  return true;
 }
 function heroAttack(){
  if(!battle||battle.phase!=='active'||battle.hero.attackCooldown>0)return false;
  const h=battle.hero;h.attackCooldown=.48;
  const target=nearest(h,battle.enemy.filter(u=>u.hp>0));
  if(!target||Math.hypot(target.x-h.x,target.y-h.y)>76)return false;
  const dx=target.x-h.x,dy=target.y-h.y,d=Math.hypot(dx,dy)||1;
  if((dx/d)*h.facingX+(dy/d)*h.facingY<-.25)return false;
  return strike({team:'friendly'},target,h.attack);
 }
 function move(unit,target,speed,dt){
  const dx=target.x-unit.x,dy=target.y-unit.y,d=Math.hypot(dx,dy);
  if(d>.01){const step=Math.min(d,speed*dt);unit.x+=dx/d*step;unit.y+=dy/d*step}
  unit.x=clamp(unit.x,22,978);unit.y=clamp(unit.y,80,578);
  return d;
 }
 function updateUnits(units,targets,dt,team){
  units.forEach(unit=>{
   if(unit.hp<=0)return;
   unit.cooldown=Math.max(0,unit.cooldown-dt);
   let target=nearest(unit,targets);
   if(!target)return;
   let speed=unit.speed;
   if(team==='friendly'){
    if(battle.order==='hold'){
     const anchor=unit._anchor||(unit._anchor={x:unit.x,y:unit.y});
     if(Math.hypot(target.x-unit.x,target.y-unit.y)<42&&unit.cooldown<=0){unit.cooldown=.95;strike(unit,target,unit.attack)}
     else if(Math.hypot(anchor.x-unit.x,anchor.y-unit.y)>20)move(unit,anchor,speed*.75,dt);
     return;
    }
    if(battle.order==='regroup'){
     const h=battle.hero,dx=h.x-unit.x,dy=h.y-unit.y,d=Math.hypot(dx,dy);
     if(d>42){move(unit,{x:h.x+(unit.id.charCodeAt(unit.id.length-1)%5-2)*13,y:h.y+38},speed*1.15,dt);return}
    }
    if(battle.order==='advance')speed*=1.08;
   }
   const distance=move(unit,target,speed,dt);
   if(distance<25&&unit.cooldown<=0){unit.cooldown=.9;strike(unit,target,unit.attack)}
  });
 }
 function step(delta){
  if(!battle||battle.phase!=='active')return snapshot();
  const dt=clamp(finite(delta,0),0,.05);if(!dt)return snapshot();
  battle.elapsed+=dt;
  const h=battle.hero;
  h.attackCooldown=Math.max(0,h.attackCooldown-dt);
  const moveLength=Math.hypot(h.moveX,h.moveY);
  if(moveLength>.01){h.x=clamp(h.x+h.moveX/moveLength*h.speed*dt,22,978);h.y=clamp(h.y+h.moveY/moveLength*h.speed*dt,80,578)}
  updateUnits(battle.friendly,battle.enemy,dt,'friendly');
  updateUnits(battle.enemy,[h,...battle.friendly],dt,'enemy');
  if(battle.hero.hp<=0)finish('defeat','hero-defeated');
  else if(counts(battle.enemy)===0)finish('victory','enemy-routed');
  else if(counts(battle.friendly)===0)finish('defeat','warband-routed');
  else if(battle.morale.enemy<=0)finish('victory','enemy-morale-broken');
  else if(battle.morale.friendly<=0)finish('defeat','friendly-morale-broken');
  if(battle.phase==='active')emit('battle:state-updated',snapshot());
  return snapshot();
 }
 function getResult(){return battle&&battle.result?copy(battle.result):null}
 function active(){return !!battle&&battle.phase==='active'}
 return Object.freeze({start,setPlayerInput,issueOrder,step,snapshot,getResult,active,events});
}
root.IronCrownBattleSimulation=Object.freeze({create,MAX_FIELD_TROOPS});
})(window);
