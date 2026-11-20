(function(){
'use strict';
function create(options){
 const getState=options.getState;
 const getPlace=options.getPlace;
 const getDiscoveryIds=options.getDiscoveryIds;
 const getItemIds=options.getItemIds;
 const getCharacterRoster=options.getCharacterRoster;
 const setCharacterRoster=options.setCharacterRoster;
 const createCharacterRoster=options.createCharacterRoster;
 const notify=typeof options.notify==='function'?options.notify:()=>{};
 const SAVE_VERSION=options.version||9;
 const PARTY_LIMIT=Number.isInteger(options.partyLimit)?Math.max(1,Math.min(12,options.partyLimit)):4;
 const STORAGE_KEY='ironCrownSave';
 function save(){
  try{
   const state=getState();
   const savedState={
    current:state.current,freePosition:state.freePosition,gold:state.gold,troops:state.troops,
    health:state.health,day:state.day,minutes:state.minutes,camped:state.camped,supplies:state.supplies,
    inventory:state.inventory,equipment:state.equipment,discoveries:state.discoveries,
    defeatedParties:state.defeatedParties,metCaravans:state.metCaravans,
    houseStanding:state.houseStanding,audiences:state.audiences,
    activePartyIds:Array.isArray(state.activePartyIds)?[...new Set(state.activePartyIds.filter(id=>typeof id==='string'))].slice(0,PARTY_LIMIT):[],
    activeBattle:state.activeBattle&&typeof state.activeBattle==='object'&&!Array.isArray(state.activeBattle)?state.activeBattle:null,
    resolvedBattleIds:Array.isArray(state.resolvedBattleIds)?[...new Set(state.resolvedBattleIds.filter(id=>typeof id==='string'&&id.length<=160))].slice(-200):[]
   };
   if(typeof getCharacterRoster==='function')savedState.characterRoster=getCharacterRoster();
   const payload={version:SAVE_VERSION,savedAt:new Date().toISOString(),state:savedState};
   localStorage.setItem(STORAGE_KEY,JSON.stringify(payload));
   return true;
  }catch(e){notify('Save unavailable on this device.');return false;}
 }
 function load(){
  let raw=null;
  try{
   raw=localStorage.getItem(STORAGE_KEY);
   if(!raw)return false;
   const parsed=JSON.parse(raw);
   if(!parsed||typeof parsed!=='object')throw new Error('Invalid save');
   if(Number.isInteger(parsed.version)&&parsed.version>SAVE_VERSION){
    notify('This save was created by a newer version. The existing save was left untouched.');
    return false;
   }
   const d=parsed.state&&typeof parsed.state==='object'?parsed.state:parsed;
   if(!d||typeof d!=='object'||!getPlace(d.current))throw new Error('Unsupported save');
   const state=getState();
   const number=(v,fallback,min,max)=>Number.isFinite(v)?Math.max(min,Math.min(max,v)):fallback;
   state.current=d.current;
   state.freePosition=d.freePosition&&Number.isFinite(d.freePosition.x)&&Number.isFinite(d.freePosition.y)?{x:Math.max(0,Math.min(1600,d.freePosition.x)),y:Math.max(0,Math.min(1000,d.freePosition.y))}:null;
   state.gold=number(d.gold,85,0,999999);state.troops=number(d.troops,12,0,9999);
   state.health=number(d.health,100,0,100);state.day=number(d.day,1,1,999999);
   state.minutes=number(d.minutes,480,0,1439);state.camped=!!d.camped;
   state.supplies=number(d.supplies,5,0,999999);
   const validItems=getItemIds();
   state.inventory=Array.isArray(d.inventory)?[...new Set(d.inventory.filter(id=>validItems.includes(id)))]:['worn-blade','travel-cloak'];
   const slots={weapon:null,armour:null,offhand:null};
   if(d.equipment&&typeof d.equipment==='object')Object.keys(slots).forEach(slot=>{const id=d.equipment[slot];if(typeof id==='string'&&state.inventory.includes(id)&&getItemIds(slot).includes(id))slots[slot]=id});
   if(!slots.weapon&&state.inventory.includes('worn-blade'))slots.weapon='worn-blade';
   if(!slots.armour&&state.inventory.includes('travel-cloak'))slots.armour='travel-cloak';
   state.equipment=slots;
   const validDiscoveries=getDiscoveryIds();
   state.discoveries=Array.isArray(d.discoveries)?[...new Set(d.discoveries.filter(id=>validDiscoveries.includes(id)))]:[];
   const validParties=['red-bandits','ashen-patrol','marcher-patrol'];
   const validCaravans=['west-caravan','river-caravan'];
   state.defeatedParties=Array.isArray(d.defeatedParties)?[...new Set(d.defeatedParties.filter(id=>validParties.includes(id)))]:[];
   state.metCaravans=Array.isArray(d.metCaravans)?[...new Set(d.metCaravans.filter(id=>validCaravans.includes(id)))]:[];
   state.houseStanding={alder:number(d.houseStanding?.alder,0,0,100),veyne:number(d.houseStanding?.veyne,0,0,100),rowan:number(d.houseStanding?.rowan,0,0,100)};
   state.audiences=Array.isArray(d.audiences)?[...new Set(d.audiences.filter(id=>['alder','veyne','rowan'].includes(id)))]:[];
   if(typeof setCharacterRoster==='function'){
    if(parsed.version<=SAVE_VERSION&&d.characterRoster&&typeof d.characterRoster==='object'){
     setCharacterRoster(d.characterRoster);
    }else if(typeof createCharacterRoster==='function'){
     setCharacterRoster(createCharacterRoster().snapshot());
     if(parsed.version===SAVE_VERSION)notify('The save had no character roster; a fresh empty roster was created.');
    }
   }
   const roster=state.characterRoster;
   const knownCharacterIds=new Set(roster&&typeof roster.list==='function'?roster.list().map(character=>character.id):[]);
   const requestedPartyIds=Array.isArray(d.activePartyIds)?d.activePartyIds:[];
   state.activePartyIds=[...new Set(requestedPartyIds.filter(id=>typeof id==='string'&&knownCharacterIds.has(id)))].slice(0,PARTY_LIMIT);
   state.activeBattle=d.activeBattle&&typeof d.activeBattle==='object'&&!Array.isArray(d.activeBattle)?d.activeBattle:null;
   state.resolvedBattleIds=Array.isArray(d.resolvedBattleIds)?[...new Set(d.resolvedBattleIds.filter(id=>typeof id==='string'&&id.length<=160))].slice(-200):[];
   if(parsed.version!==SAVE_VERSION)save();
   return true;
  }catch(e){
   try{if(raw)localStorage.setItem(STORAGE_KEY+'_corrupt_'+Date.now(),raw);}catch(_){}
   notify('A damaged save was found. A fresh journey has started; the old save was kept as a recovery copy.');
   return false;
  }
 }
 return Object.freeze({save,load});
}
window.IronCrownSave=Object.freeze({create});
})();