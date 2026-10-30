(function(){
'use strict';
function create(options){
 const getState=options.getState;
 const getPlace=options.getPlace;
 const getDiscoveryIds=options.getDiscoveryIds;
 const notify=options.notify;
 const SAVE_VERSION=options.version;
 const STORAGE_KEY='ironCrownSave';
 function save(){
  try{
   const state=getState();
   const payload={version:SAVE_VERSION,savedAt:new Date().toISOString(),state:{current:state.current,freePosition:state.freePosition,gold:state.gold,troops:state.troops,health:state.health,day:state.day,minutes:state.minutes,camped:state.camped,supplies:state.supplies,discoveries:state.discoveries,houseStanding:state.houseStanding,audiences:state.audiences}};
   localStorage.setItem(STORAGE_KEY,JSON.stringify(payload));return true;
  }catch(e){notify('Save unavailable on this device.');return false;}
 }
 function load(){
  try{
   const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return;
   const parsed=JSON.parse(raw);if(!parsed||typeof parsed!=='object')throw new Error('Invalid save');
   const d=parsed.version===SAVE_VERSION?parsed.state:parsed.state||parsed;
   if(!d||typeof d!=='object'||!getPlace(d.current))throw new Error('Unsupported save');
   const state=getState();
   const number=(v,fallback,min,max)=>Number.isFinite(v)?Math.max(min,Math.min(max,v)):fallback;
   state.current=d.current;
   state.freePosition=d.freePosition&&Number.isFinite(d.freePosition.x)&&Number.isFinite(d.freePosition.y)?{x:Math.max(0,Math.min(1600,d.freePosition.x)),y:Math.max(0,Math.min(1000,d.freePosition.y))}:null;
   state.gold=number(d.gold,85,0,999999);state.troops=number(d.troops,12,0,9999);
   state.health=number(d.health,100,0,100);state.day=number(d.day,1,1,999999);
   state.minutes=number(d.minutes,480,0,1439);state.camped=!!d.camped;
   state.supplies=number(d.supplies,5,0,999999);
   const validDiscoveries=getDiscoveryIds();
   state.discoveries=Array.isArray(d.discoveries)?[...new Set(d.discoveries.filter(id=>validDiscoveries.includes(id)))]:[];
   state.houseStanding={alder:number(d.houseStanding?.alder,0,0,100),veyne:number(d.houseStanding?.veyne,0,0,100),rowan:number(d.houseStanding?.rowan,0,0,100)};
   state.audiences=Array.isArray(d.audiences)?[...new Set(d.audiences.filter(id=>['alder','veyne','rowan'].includes(id)))]:[];
   if(parsed.version!==SAVE_VERSION)save();
  }catch(e){
   try{const raw=localStorage.getItem(STORAGE_KEY);if(raw)localStorage.setItem(STORAGE_KEY+'_corrupt_'+Date.now(),raw);}catch(_){}
   notify('A damaged save was found. A fresh journey has started; the old save was kept as a recovery copy.');
  }
 }
 return Object.freeze({save,load});
}
window.IronCrownSave=Object.freeze({create});
})();
