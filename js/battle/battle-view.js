(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.IronCrownBattleView=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
'use strict';
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const alive=units=>(Array.isArray(units)?units:[]).filter(unit=>unit&&unit.hp>0);
const titleCase=value=>String(value||'advance').charAt(0).toUpperCase()+String(value||'advance').slice(1);
function create(options){
 options=options||{};
 const controller=options.controller,e=options.elements||{};
 if(!controller||typeof controller.step!=='function'||typeof controller.snapshot!=='function'||typeof controller.setPlayerInput!=='function'||typeof controller.issueOrder!=='function'||typeof controller.retreat!=='function')throw new TypeError('A campaign battle controller is required');
 const required=['root','canvas','title','subtitle','heroHealth','friendlyCount','enemyCount','order','message','result','resultTitle','resultText','continueButton','retreatButton','attackButton'];
 required.forEach(key=>{if(!e[key])throw new TypeError('Missing battlefield element: '+key)});
 const ctx=e.canvas.getContext&&e.canvas.getContext('2d');
 if(!ctx)throw new Error('A 2D battlefield canvas is required');
 const doc=options.document||root.document;
 const requestFrame=options.requestFrame||root.requestAnimationFrame;
 const cancelFrame=options.cancelFrame||root.cancelAnimationFrame;
 const moveButtons=Array.isArray(e.moveButtons)?e.moveButtons:[];
 const orderButtons=Array.isArray(e.orderButtons)?e.orderButtons:[];
 const keys={up:false,down:false,left:false,right:false};
 const touch={up:false,down:false,left:false,right:false};
 const cleanups=[];
 let running=false,completed=false,frameId=null,lastTime=0,facing={x:1,y:0},lastResult=null;
 function listen(target,type,handler){
  if(!target||typeof target.addEventListener!=='function')return;
  target.addEventListener(type,handler);
  cleanups.push(()=>target.removeEventListener&&target.removeEventListener(type,handler));
 }
 function setControlsDisabled(disabled){
  moveButtons.concat(orderButtons,[e.attackButton,e.retreatButton]).forEach(button=>{if(button)button.disabled=!!disabled});
 }
 function axes(){
  return {
   x:(keys.right||touch.right?1:0)-(keys.left||touch.left?1:0),
   y:(keys.down||touch.down?1:0)-(keys.up||touch.up?1:0)
  };
 }
 function clearInput(){
  Object.keys(keys).forEach(key=>{keys[key]=false;touch[key]=false});
 }
 function updateInput(){
  const movement=axes();
  if(movement.x||movement.y){
   const length=Math.hypot(movement.x,movement.y)||1;
   facing={x:movement.x/length,y:movement.y/length};
  }
  controller.setPlayerInput({moveX:movement.x,moveY:movement.y,facingX:facing.x,facingY:facing.y});
 }
 function attack(){
  if(!running||completed)return false;
  return controller.setPlayerInput({attack:true,facingX:facing.x,facingY:facing.y});
 }
 function order(value){
  if(!running||completed)return false;
  const accepted=controller.issueOrder(value);
  if(accepted){
   e.order.textContent=titleCase(value);
   e.message.textContent='Order changed: '+value+'.';
   render(controller.snapshot());
  }
  return accepted;
 }
 function retreat(){
  if(!running||completed)return false;
  const response=controller.retreat();
  if(!response||!response.ok){e.message.textContent=response&&response.reason||'Retreat is unavailable.';return false}
  finish(response.result);
  return true;
 }
 function drawTerrain(){
  ctx.fillStyle='#4c7048';ctx.fillRect(0,0,1000,620);
  ctx.fillStyle='#567b4d';ctx.fillRect(0,0,1000,620);
  ctx.strokeStyle='#9eb47a55';ctx.lineWidth=1;
  for(let y=35;y<620;y+=48){
   ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1000,y);ctx.stroke();
  }
  ctx.fillStyle='#8e805c55';ctx.beginPath();
  ctx.moveTo(85,170);ctx.lineTo(915,170);ctx.lineTo(980,570);ctx.lineTo(20,570);ctx.closePath();ctx.fill();
  ctx.fillStyle='#68705d';ctx.fillRect(420,28,160,64);ctx.fillRect(405,18,36,76);ctx.fillRect(559,18,36,76);
  ctx.fillStyle='#414c3f';ctx.fillRect(476,57,48,35);
  ctx.fillStyle='#9a9d83';for(let x=410;x<590;x+=30)ctx.fillRect(x,12,17,13);
  ctx.fillStyle='#b64f43';ctx.fillRect(62,84,34,14);
  ctx.fillStyle='#477bb2';ctx.fillRect(904,520,34,14);
 }
 function drawUnit(unit,hero){
  if(!unit||unit.hp<=0)return;
  const x=clamp(unit.x,0,1000),y=clamp(unit.y,0,620);
  const friendly=hero||unit.team==='friendly';
  const main=hero?'#d2a74f':friendly?'#3e78a8':'#a9473e';
  const light=hero?'#f0d17c':friendly?'#8bb4d5':'#d47b69';
  ctx.fillStyle='#17251c88';ctx.beginPath();ctx.ellipse(x,y+12,hero?18:14,7,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=main;ctx.fillRect(x-(hero?10:8),y-5,hero?20:16,19);
  ctx.fillStyle=light;ctx.fillRect(x-(hero?7:6),y-4,hero?14:12,12);
  ctx.fillStyle='#d7b18b';ctx.beginPath();ctx.arc(x,y-13,hero?8:6,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=hero?'#f0d17c':friendly?'#a9c2d4':'#b7b7a4';
  ctx.fillRect(x-(hero?8:6),y-19,hero?16:12,4);
  ctx.strokeStyle='#302d27';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-4,y+12);ctx.lineTo(x-6,y+18);ctx.moveTo(x+4,y+12);ctx.lineTo(x+6,y+18);ctx.stroke();
  if(hero){
   ctx.strokeStyle='#e4e5dc';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+facing.x*8,y+facing.y*8);ctx.lineTo(x+facing.x*27,y+facing.y*27);ctx.stroke();
  }
  if(hero||unit.hp<unit.maxHp){
   const width=hero?34:26,left=x-width/2,top=y-29;
   ctx.fillStyle='#22251f';ctx.fillRect(left,top,width,4);
   ctx.fillStyle=hero?'#e8c86b':friendly?'#76add5':'#d66d5e';
   ctx.fillRect(left,top,width*clamp(unit.hp/Math.max(1,unit.maxHp),0,1),4);
  }
  if(unit.characterId){
   ctx.fillStyle='#f2d68e';ctx.beginPath();ctx.arc(x,y-25,2.5,0,Math.PI*2);ctx.fill();
  }
 }
 function draw(snapshot){
  if(!snapshot)return;
  ctx.clearRect(0,0,1000,620);drawTerrain();
  const units=[...alive(snapshot.friendly),...alive(snapshot.enemy)].sort((a,b)=>a.y-b.y);
  units.forEach(unit=>drawUnit(unit,false));
  drawUnit(snapshot.hero,true);
  ctx.fillStyle='#f7e9c9';ctx.font='bold 14px Arial';ctx.textAlign='center';
  ctx.fillText('ENEMY HOST',500,24);ctx.fillText('YOUR BANNER',500,600);
 }
 function render(snapshot){
  if(!snapshot)return;
  const friendly=snapshot.remaining&&Number.isFinite(snapshot.remaining.friendly)?snapshot.remaining.friendly:alive(snapshot.friendly).length;
  const enemy=snapshot.remaining&&Number.isFinite(snapshot.remaining.enemy)?snapshot.remaining.enemy:alive(snapshot.enemy).length;
  e.heroHealth.textContent=Math.max(0,Math.round(snapshot.hero&&snapshot.hero.hp||0))+'/'+Math.max(1,Math.round(snapshot.hero&&snapshot.hero.maxHp||100));
  e.friendlyCount.textContent=String(friendly);
  e.enemyCount.textContent=String(enemy);
  e.order.textContent=titleCase(snapshot.order);
  if(e.canvas.setAttribute)e.canvas.setAttribute('aria-label','Battlefield. Commander health '+e.heroHealth.textContent+'. '+friendly+' friendly units and '+enemy+' enemy units remain.');
  draw(snapshot);
 }
 function resultText(result){
  const reward=result&&result.rewards&&Number.isFinite(result.rewards.gold)?result.rewards.gold:0;
  const survivors=result&&result.survivors&&result.survivors.friendly?
   Object.values(result.survivors.friendly).reduce((sum,count)=>sum+count,0):0;
  if(result&&result.outcome==='victory')return 'The enemy has been routed. '+survivors+' friendly soldiers remain. You gained '+reward+' gold.';
  if(result&&result.reason==='retreated')return 'You withdrew from the encounter. '+survivors+' friendly soldiers remain. The enemy party is still on the map.';
  return 'Your company was forced from the field. '+survivors+' friendly soldiers remain. Rest and rebuild before another encounter.';
 }
 function finish(result){
  if(completed||!result)return;
  completed=true;running=false;lastResult=result;clearInput();setControlsDisabled(true);
  e.result.hidden=false;
  e.resultTitle.textContent=result.outcome==='victory'?'Victory':result.reason==='retreated'?'Retreat':'Defeat';
  e.resultText.textContent=resultText(result);
  e.message.textContent='Battle resolved. Return to the campaign when ready.';
  render(controller.snapshot());
  if(typeof options.onComplete==='function')options.onComplete(result);
 }
 function loop(now){
  if(!running)return;
  const delta=lastTime?clamp((now-lastTime)/1000,0,.05):.016;
  lastTime=now;
  try{
   updateInput();
   const snapshot=controller.step(delta);
   render(snapshot);
   if(snapshot&&snapshot.phase==='ended'){
    finish(controller.getResult());
    return;
   }
   frameId=requestFrame(loop);
  }catch(error){
   running=false;clearInput();
   e.message.textContent='Battle paused because the simulation could not continue. Retreat remains available.';
   setControlsDisabled(false);
   e.attackButton.disabled=true;
  }
 }
 function open(meta){
  if(running||!controller.active||!controller.active()||typeof requestFrame!=='function')return false;
  const snapshot=controller.snapshot();
  if(!snapshot||snapshot.phase!=='active')return false;
  completed=false;lastResult=null;lastTime=0;frameId=null;clearInput();facing={x:1,y:0};
  e.root.hidden=false;e.root.setAttribute('aria-hidden','false');
  e.title.textContent='Battle at '+String(meta&&meta.enemyName||'the frontier');
  e.subtitle.textContent='Lead your companions. Hold the line or regroup when the fight turns.';
  e.result.hidden=true;e.message.textContent='Move with WASD or the arrow keys. Space attacks. Use the order buttons to direct your warband.';
  setControlsDisabled(false);render(snapshot);
  if(e.canvas.focus)e.canvas.focus();
  running=true;frameId=requestFrame(loop);
  return true;
 }
 function close(){
  if(running)return false;
  if(frameId!==null&&typeof cancelFrame==='function')cancelFrame(frameId);
  frameId=null;e.root.hidden=true;e.root.setAttribute('aria-hidden','true');
  if(typeof options.onClose==='function')options.onClose(lastResult);
  if(options.returnFocus&&options.returnFocus.focus)options.returnFocus.focus();
  return true;
 }
 moveButtons.forEach(button=>{
  const direction=button.getAttribute('data-battle-move');
  if(!keys.hasOwnProperty(direction))return;
  const down=event=>{if(!running||completed)return;if(event&&event.preventDefault)event.preventDefault();touch[direction]=true;if(button.setPointerCapture&&event&&event.pointerId!==undefined)button.setPointerCapture(event.pointerId)};
  const up=event=>{if(event&&event.preventDefault)event.preventDefault();touch[direction]=false};
  listen(button,'pointerdown',down);listen(button,'pointerup',up);listen(button,'pointercancel',up);listen(button,'lostpointercapture',up);
 });
 orderButtons.forEach(button=>listen(button,'click',()=>order(button.getAttribute('data-battle-order'))));
 listen(e.attackButton,'click',attack);
 listen(e.retreatButton,'click',retreat);
 listen(e.continueButton,'click',close);
 if(doc){
  listen(doc,'keydown',event=>{
   if(!running||completed)return;
   const target=event.target,tag=target&&String(target.tagName||'').toUpperCase();
   if(['BUTTON','INPUT','TEXTAREA','SELECT'].includes(tag))return;
   const key=String(event.key||'').toLowerCase();
   const direction={arrowup:'up',w:'up',arrowdown:'down',s:'down',arrowleft:'left',a:'left',arrowright:'right',d:'right'}[key];
   if(direction){if(event.preventDefault)event.preventDefault();keys[direction]=true;return}
   if(key===' '){if(event.preventDefault)event.preventDefault();if(!event.repeat)attack();return}
   if(key==='1')order('advance');
   if(key==='2')order('hold');
   if(key==='3')order('regroup');
  });
  listen(doc,'keyup',event=>{
   const key=String(event.key||'').toLowerCase();
   const direction={arrowup:'up',w:'up',arrowdown:'down',s:'down',arrowleft:'left',a:'left',arrowright:'right',d:'right'}[key];
   if(direction)keys[direction]=false;
  });
 }
 if(root.addEventListener)listen(root,'blur',clearInput);
 return Object.freeze({open,close,active:()=>running,completed:()=>completed,getResult:()=>lastResult,destroy:()=>{if(running)retreat();cleanups.forEach(cleanup=>cleanup());if(!running)close()}});
}
return Object.freeze({create});
});