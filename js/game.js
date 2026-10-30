(function(){
'use strict';
const $=id=>document.getElementById(id);
const places=window.IronCrownWorld.places;
const discoveries=window.IronCrownWorld.discoveries;
const byId=id=>places.find(p=>p.id===id);
let state=window.IronCrownState.createInitialState();
let selected=null,drag=null,playerGroup=null,roamMode=false;
const currentPoint=()=>state.freePosition||byId(state.current);
const svgNS='http://www.w3.org/2000/svg';
function node(tag,attrs,parent){let n=document.createElementNS(svgNS,tag);Object.keys(attrs||{}).forEach(k=>n.setAttribute(k,attrs[k]));(parent||$('world')).appendChild(n);return n}
function label(x,y,str,parent){let t=node('text',{x:x,y:y,fill:'#f1e6c9','font-family':'Georgia','font-size':17,'paint-order':'stroke',stroke:'#17231d','stroke-width':4,'stroke-linejoin':'round'},parent);t.textContent=str;return t}
function settlementIcon(p,g){node('circle',{cx:p.x,cy:p.y,r:24,fill:'transparent',stroke:'transparent',class:'hit'},g);node('circle',{cx:p.x,cy:p.y,r:13,fill:'#1a241e',stroke:'#dfd0a7','stroke-width':2},g);
 if(p.kind==='village'){node('path',{d:'M'+(p.x-8)+' '+(p.y+3)+'l8 -9 8 9v8h-16z',fill:'#c69a69',stroke:'#332d20','stroke-width':1.5},g)}
 else if(p.kind==='town'){node('path',{d:'M'+(p.x-9)+' '+(p.y+8)+'v-14h18v14z M'+(p.x-12)+' '+(p.y-6)+'l4 -6h16l4 6z',fill:'#d4bd83',stroke:'#332d20','stroke-width':1.5},g)}
 else{node('path',{d:'M'+(p.x-10)+' '+(p.y+9)+'v-16h20v16z M'+(p.x-12)+' '+(p.y-7)+'v-6h6v6 M'+(p.x-3)+' '+(p.y-7)+'v-6h6v6 M'+(p.x+6)+' '+(p.y-7)+'v-6h6v6',fill:'#b6c0b0',stroke:'#332d20','stroke-width':1.5},g)}
 label(p.x+20,p.y+5,p.name,g);
}
function drawSettlements(){let g=$('settlements');places.forEach(p=>{let group=node('g',{class:'settlement',tabindex:0,role:'button','aria-label':p.name},g);settlementIcon(p,group);group.addEventListener('click',e=>{e.stopPropagation();selectPlace(p)});group.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectPlace(p)}})})}
function drawParties(){let g=$('roadParties');[[900,390,'caravan'],[980,650,'bandit'],[340,720,'caravan']].forEach(a=>{let group=node('g',{transform:'translate('+a[0]+' '+a[1]+')'},g);if(a[2]==='caravan'){node('rect',{x:-8,y:-6,width:16,height:12,rx:3,fill:'#d4a66b',stroke:'#1d2118','stroke-width':2},group);node('circle',{cx:-5,cy:8,r:3,fill:'#211e17'},group);node('circle',{cx:5,cy:8,r:3,fill:'#211e17'},group)}else node('path',{d:'M0 -9L9 8H-9Z',fill:'#b76e61',stroke:'#1d2118','stroke-width':2},group);group.addEventListener('click',()=>notify(a[2]==='caravan'?'A merchant caravan is travelling along the road.':'A suspicious band is moving through the countryside.'))})}
function drawPlayer(){if(!playerGroup){playerGroup=node('g',{},$('player'));node('circle',{cx:0,cy:5,r:17,fill:'#101712',opacity:.5},playerGroup);node('circle',{r:13,fill:'#e0c37e',stroke:'#201e17','stroke-width':3},playerGroup);node('circle',{r:7,fill:'#e7dfc8',stroke:'#1a241e','stroke-width':2},playerGroup);node('path',{d:'M0 -23L-5 -13H5Z',fill:'#e0c37e',stroke:'#1b211a','stroke-width':1.5},playerGroup);label(-33,-25,'YOU',playerGroup)}let p=currentPoint(),x=p.x,y=p.y;if(state.target&&state.from&&state.to){x=state.from.x+(state.to.x-state.from.x)*state.progress;y=state.from.y+(state.to.y-state.from.y)*state.progress}playerGroup.setAttribute('transform','translate('+x+' '+y+')')}
function drawRoute(){let g=$('route');g.innerHTML='';if(state.target)node('path',{d:'M'+state.from.x+' '+state.from.y+' L'+state.to.x+' '+state.to.y,fill:'none',stroke:state.target==='__free__'?'#9bd0b0':'#f1d58e','stroke-width':4,'stroke-dasharray':'10 8'},g)}
function selectPlace(p){selected=p;$('drawer').classList.add('open');$('kindLabel').textContent=p.kind==='castle'?'Fortification':p.kind==='town'?'Settlement':'Rural holding';$('placeName').textContent=p.name;$('placeTag').textContent=p.kind;$('description').textContent=p.desc;$('faction').textContent=p.faction;$('prosperity').textContent=p.prosperity;$('garrison').textContent=p.garrison+' soldiers';let here=currentPoint(),d=Math.round(Math.hypot(p.x-here.x,p.y-here.y)/10);$('distance').textContent=p.id===state.current?'You are here':d+' leagues (approx.)';$('travel').textContent=p.id===state.current?'Already here':'Travel here';$('travel').disabled=(!state.freePosition&&p.id===state.current)||!!state.target;$('visit').disabled=p.id!==state.current;updateAudiencePanel(p)}
function updateAudiencePanel(p){const houses={kingsbridge:{id:'alder',name:'House Alder',proof:'watchtower'},dunmar:{id:'veyne',name:'House Veyne',proof:'cache'},silverkeep:{id:'rowan',name:'House Rowan',proof:'shrine'}};const h=houses[p.id],btn=$('audience');if(!h){$('houseStanding').textContent='No noble house based here';btn.style.display='none';return}const score=state.houseStanding[h.id]||0;$('houseStanding').textContent=h.name+' · '+score+'/100';btn.style.display=p.id===state.current?'block':'none';btn.disabled=state.audiences.includes(h.id)||!state.discoveries.includes(h.proof);btn.textContent=state.audiences.includes(h.id)?'Audience already held':state.discoveries.includes(h.proof)?'Present evidence to '+h.name:'Find the house evidence first'}
function requestAudience(){if(!selected||selected.id!==state.current)return;const houses={kingsbridge:{id:'alder',name:'House Alder',proof:'watchtower'},dunmar:{id:'veyne',name:'House Veyne',proof:'cache'},silverkeep:{id:'rowan',name:'House Rowan',proof:'shrine'}};const h=houses[selected.id];if(!h||state.audiences.includes(h.id)||!state.discoveries.includes(h.proof)){notify('The house is not ready to hear your petition.');return}state.audiences.push(h.id);state.houseStanding[h.id]=Math.min(100,(state.houseStanding[h.id]||0)+25);$('description').textContent=selected.desc+' The house has examined your evidence and agreed to hear your claim.';updateAudiencePanel(selected);save();notify(h.name+' grants you an audience. Standing +25.')}
function startFreeRoam(x,y){if(state.target){notify('Wait until your current journey ends.');return}state.camped=false;updateCampControls();state.target='__free__';state.from={x:currentPoint().x,y:currentPoint().y};state.to={x,y};state.progress=0;state.last=performance.now();drawRoute();$('drawer').classList.remove('open');$('travelTitle').textContent='Exploring the countryside';$('travelSub').textContent='Off-road travel · terrain affects your pace';$('cancel').disabled=false;roamMode=false;$('roamMode').style.borderColor='#697253';notify('Off-road destination set.');requestAnimationFrame(tick)}
function travel(){if(!selected||(!state.freePosition&&selected.id===state.current)||state.target)return;state.camped=false;updateCampControls();state.target=selected.id;state.from={x:currentPoint().x,y:currentPoint().y};state.freePosition=null;state.to={x:selected.x,y:selected.y};state.progress=0;state.last=performance.now();drawRoute();$('drawer').classList.remove('open');$('travelTitle').textContent='Travelling to '+selected.name;$('travelSub').textContent='Your party is on the road · estimated '+Math.max(8,Math.round(Math.hypot(state.to.x-state.from.x,state.to.y-state.from.y)/28))+' seconds';$('cancel').disabled=false;notify('Route plotted to '+selected.name);requestAnimationFrame(tick)}
function drawDiscoveries(){
 let g=$('discoveries');g.innerHTML='';let here=currentPoint();
 discoveries.forEach(d=>{
  let found=state.discoveries.includes(d.id),near=Math.hypot(d.x-here.x,d.y-here.y)<150;
  if(!found&&!near)return;
  let group=node('g',{transform:'translate('+d.x+' '+d.y+')'},g);
  node('circle',{r:found?15:12,fill:found?'#263b2b':'#17231f',stroke:found?'#d9bd7d':'#d7c58f','stroke-width':2,'stroke-dasharray':found?'none':'3 3'},group);
  label(19,5,found?d.name:'? Unexplored',group);
 });
}
function updateExplorationControls(){
 let here=currentPoint(),available=!!state.freePosition&&!state.target&&discoveries.some(d=>!state.discoveries.includes(d.id)&&Math.hypot(d.x-here.x,d.y-here.y)<=85);
 $('explore').classList.toggle('visible',available);$('explore').disabled=!available;
}
function explore(){
 if(!state.freePosition||state.target){notify('Explore the countryside on foot to search nearby sites.');return}
 let here=currentPoint(),site=discoveries.filter(d=>!state.discoveries.includes(d.id)).map(d=>({site:d,distance:Math.hypot(d.x-here.x,d.y-here.y)})).filter(x=>x.distance<=85).sort((a,b)=>a.distance-b.distance)[0];
 if(!site){notify('There is nothing nearby to investigate.');return}
 let d=site.site;state.discoveries.push(d.id);state.supplies+=3;state.gold+=d.gold;
 drawDiscoveries();updateExplorationControls();updateHud();save();
 notify(state.discoveries.length===3?'The three proofs are united. Your claim to the Iron Crown can now be heard!':'Discovered '+d.name+'! Found '+d.relic+', 3 supplies and '+d.gold+' gold.');
}
function terrainFactor(x,y){if(x>980&&y<250)return .55;if((x<330&&y>390&&y<640)||(x>790&&y>760)||(x>1400&&y>520))return .72;return 1}
function tick(now){if(!state.target)return;if(!state.paused){let dt=Math.min(80,now-state.last||16);let factor=state.target==='__free__'?terrainFactor(state.to.x,state.to.y):1;state.progress=Math.min(1,state.progress+dt/1000/(Math.max(8,Math.hypot(state.to.x-state.from.x,state.to.y-state.from.y)/28)/state.speed/factor));state.minutes+=dt/1000*1.7*state.speed;if(state.minutes>=1440){state.minutes-=1440;state.day++}if(state.progress>=1){if(state.target==='__free__'){state.freePosition={x:state.to.x,y:state.to.y}}else{state.current=state.target;state.freePosition=null}state.target=null;state.from=state.to=null;state.progress=0;drawDiscoveries();updateExplorationControls();$('travelTitle').textContent=state.freePosition?'Your party is exploring the wilderness':'Your party has arrived at '+byId(state.current).name;$('travelSub').textContent='Tap Roam, then choose another point on the map.';$('cancel').disabled=true;save();notify(state.freePosition?'Reached the wilderness.':'Arrived at '+byId(state.current).name);updateHud();drawPlayer();drawRoute();return}}state.last=now;drawPlayer();updateHud();requestAnimationFrame(tick)}
function visit(){if(!selected||selected.id!==state.current)return;notify('You enter '+selected.name+'. Settlement services will arrive in a later build.');$('description').textContent=selected.desc+' You are currently visiting this settlement.'}
function cancel(){if(!state.target)return;state.target=null;state.from=state.to=null;state.progress=0;$('cancel').disabled=true;$('travelTitle').textContent=state.freePosition?'Your party is in the wilderness':'Your party is at '+byId(state.current).name;$('travelSub').textContent='Journey cancelled.';drawPlayer();drawRoute();save();updateHud();notify('Journey cancelled')}
function updateCampControls(){$('camp').textContent=state.camped?'Break camp':'Camp';$('camp').disabled=!!state.target;$('rest').classList.toggle('visible',state.camped);$('rest').disabled=!!state.target||!state.camped}
function camp(){if(state.target){notify('You cannot make camp while travelling.');return}state.camped=!state.camped;updateCampControls();save();notify(state.camped?'Camp established. Your party can rest here.':'Camp broken. Ready to travel.')}
function rest(){if(!state.camped||state.target)return;state.minutes+=120;if(state.minutes>=1440){state.day+=Math.floor(state.minutes/1440);state.minutes%=1440}state.health=Math.min(100,state.health+5);updateHud();save();notify('Two hours pass. Your party has rested.')}
function updateHud(){let p=currentPoint();$('crownProgress').textContent=state.discoveries.length+'/3';$('gold').textContent=state.gold;$('troops').textContent=state.troops;$('health').textContent=state.health;$('currentName').textContent=state.target?'On the move':state.freePosition?'The Wilderness':p.name;$('currentSub').textContent=(state.target?'Travelling party · '+(state.target==='__free__'?'open country':state.to.name):state.freePosition?'Unclaimed countryside':p.faction+' · '+(p.kind==='town'?'Market town':p.kind==='castle'?'Fortress':'Village'))+' · Supplies '+state.supplies;let h=Math.floor(state.minutes/60),m=Math.floor(state.minutes%60);$('clock').textContent='DAY '+state.day+' · '+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')}
const SAVE_VERSION=window.IronCrownState.saveVersion;
function save(){try{const payload={version:SAVE_VERSION,savedAt:new Date().toISOString(),state:{current:state.current,freePosition:state.freePosition,gold:state.gold,troops:state.troops,health:state.health,day:state.day,minutes:state.minutes,camped:state.camped,supplies:state.supplies,discoveries:state.discoveries,houseStanding:state.houseStanding,audiences:state.audiences}};localStorage.setItem('ironCrownSave',JSON.stringify(payload));return true}catch(e){notify('Save unavailable on this device.');return false}}
function load(){
 try{
  const raw=localStorage.getItem('ironCrownSave');if(!raw)return;
  const parsed=JSON.parse(raw);if(!parsed||typeof parsed!=='object')throw new Error('Invalid save');
  // Older saves used a flat structure. Preserve their progress during migration.
  const d=parsed.version===SAVE_VERSION?parsed.state:parsed.state||parsed;
  if(!d||typeof d!=='object'||!byId(d.current))throw new Error('Unsupported save');
  const number=(v,fallback,min,max)=>Number.isFinite(v)?Math.max(min,Math.min(max,v)):fallback;
  state.current=d.current;
  state.freePosition=d.freePosition&&Number.isFinite(d.freePosition.x)&&Number.isFinite(d.freePosition.y)?{x:Math.max(0,Math.min(1600,d.freePosition.x)),y:Math.max(0,Math.min(1000,d.freePosition.y))}:null;
  state.gold=number(d.gold,85,0,999999);state.troops=number(d.troops,12,0,9999);
  state.health=number(d.health,100,0,100);state.day=number(d.day,1,1,999999);
  state.minutes=number(d.minutes,480,0,1439);state.camped=!!d.camped;
  state.supplies=number(d.supplies,5,0,999999);
  state.discoveries=Array.isArray(d.discoveries)?[...new Set(d.discoveries.filter(id=>discoveries.some(site=>site.id===id)))]:[];
  state.houseStanding={alder:number(d.houseStanding?.alder,0,0,100),veyne:number(d.houseStanding?.veyne,0,0,100),rowan:number(d.houseStanding?.rowan,0,0,100)};state.audiences=Array.isArray(d.audiences)?[...new Set(d.audiences.filter(id=>['alder','veyne','rowan'].includes(id)))]:[];
  if(parsed.version!==SAVE_VERSION)save();
 }catch(e){
  try{const raw=localStorage.getItem('ironCrownSave');if(raw)localStorage.setItem('ironCrownSave_corrupt_'+Date.now(),raw)}catch(_){}
  notify('A damaged save was found. A fresh journey has started; the old save was kept as a recovery copy.');
 }
}
function notify(s){let t=$('toast');t.textContent=s;t.classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>t.classList.remove('show'),2100)}
const wrap=$('mapWrap'),world=$('world');
function applyView(){let minX=1600-1600*state.zoom,minY=1000-1000*state.zoom;state.panX=Math.max(minX,Math.min(0,state.panX));state.panY=Math.max(minY,Math.min(0,state.panY));world.setAttribute('transform','translate('+state.panX+' '+state.panY+') scale('+state.zoom+')')}
function zoom(f){let old=state.zoom;state.zoom=Math.max(.7,Math.min(1.8,state.zoom*f));let cx=800,cy=500;state.panX=cx-(cx-state.panX)*state.zoom/old;state.panY=cy-(cy-state.panY)*state.zoom/old;applyView()}
function center(){let p=currentPoint();state.panX=800-p.x*state.zoom;state.panY=500-p.y*state.zoom;applyView()}
wrap.addEventListener('pointerdown',e=>{if(e.target.closest('.settlement'))return;let r=wrap.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,px:state.panX,py:state.panY,sx:1600/r.width,sy:1000/r.height,moved:false};wrap.classList.add('drag');wrap.setPointerCapture(e.pointerId)});
wrap.addEventListener('pointermove',e=>{if(!drag)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7)drag.moved=true;state.panX=drag.px+(e.clientX-drag.x)*drag.sx;state.panY=drag.py+(e.clientY-drag.y)*drag.sy;applyView()});
wrap.addEventListener('pointerup',e=>{if(drag&&!drag.moved&&roamMode&&!e.target.closest('.settlement')){let pt=$('map').createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;let q=pt.matrixTransform($('map').getScreenCTM().inverse());let x=(q.x-state.panX)/state.zoom,y=(q.y-state.panY)/state.zoom;if(x>20&&x<1580&&y>20&&y<980)startFreeRoam(x,y)}drag=null;wrap.classList.remove('drag')});['pointercancel','lostpointercapture'].forEach(k=>wrap.addEventListener(k,()=>{drag=null;wrap.classList.remove('drag')}));
wrap.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?1.08:.92)},{passive:false});
$('audience').onclick=requestAudience;$('explore').onclick=explore;$('roamMode').onclick=()=>{roamMode=!roamMode;$('roamMode').style.borderColor=roamMode?'#e0c37e':'#697253';notify(roamMode?'Roam mode: tap open ground to set a destination.':'Roam mode off.')};$('zoomIn').onclick=()=>zoom(1.18);$('zoomOut').onclick=()=>zoom(.85);$('center').onclick=center;$('travel').onclick=travel;$('camp').onclick=camp;$('rest').onclick=rest;$('visit').onclick=visit;$('close').onclick=()=>$('drawer').classList.remove('open');$('cancel').onclick=cancel;
$('pause').onclick=()=>{state.paused=!state.paused;$('pause').textContent=state.paused?'▶ Resume':'Ⅱ Pause';if(state.target)state.last=performance.now()};
$('speed').onclick=()=>{state.speed=state.speed===1?2:state.speed===2?4:1;$('speed').textContent='▶▶ '+state.speed+'×'};
load();drawSettlements();drawParties();drawPlayer();drawDiscoveries();updateExplorationControls();updateHud();updateCampControls();$('travelTitle').textContent=state.freePosition?'Your party is in the wilderness':'Your party is at '+byId(state.current).name;applyView();center();window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});window.addEventListener('resize',applyView);
if('serviceWorker' in navigator && location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();
