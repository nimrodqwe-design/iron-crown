(function(root){
'use strict';
const VALID_ROLES=new Set(['companion','officer','specialist','soldier']);
const VALID_MOTIVATIONS=new Set(['coin','safety','glory','loyalty','vengeance','knowledge']);
const VALID_STATUSES=new Set(['available','travelling','assigned','captured','recovering']);
const clone=value=>JSON.parse(JSON.stringify(value));
const clamp=(value,fallback)=>Number.isFinite(value)?Math.max(0,Math.min(100,value)):fallback;
function validCampaignId(value){return typeof value==='string'&&/^[A-Za-z0-9_-]{1,64}$/.test(value);}
function makeCampaignId(){
 const cryptoApi=root.crypto;
 if(cryptoApi&&typeof cryptoApi.randomUUID==='function')return cryptoApi.randomUUID();
 return 'c-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12);
}
function normaliseCharacter(input,campaignId){
 if(!input||typeof input!=='object')throw new TypeError('Character is required');
 const prefix='ic:'+campaignId+':character:';
 if(typeof input.id!=='string'||!input.id.startsWith(prefix)||! /^[1-9][0-9]*$/.test(input.id.slice(prefix.length)))throw new TypeError('Character requires a campaign-scoped stable id');
 const role=VALID_ROLES.has(input.role)?input.role:'companion';
 const motivation=VALID_MOTIVATIONS.has(input.motivation)?input.motivation:'coin';
 const status=VALID_STATUSES.has(input.status)?input.status:'available';
 return Object.freeze({
  id:input.id,
  name:String(input.name||'Unknown character').trim().slice(0,80)||'Unknown character',
  role,
  background:String(input.background||'').trim().slice(0,160),
  candidateId:typeof input.candidateId==='string'&&/^[a-z0-9][a-z0-9-]{0,63}$/i.test(input.candidateId)?input.candidateId:null,
  motivation,
  status,
  recruited:input.recruited!==false,
  trust:clamp(input.trust,50),
  morale:clamp(input.morale,60)
 });
}
function create(options){
 options=options||{};
 const campaignId=validCampaignId(options.campaignId)?options.campaignId:makeCampaignId();
 let nextCharacterSequence=Number.isSafeInteger(options.nextCharacterSequence)&&options.nextCharacterSequence>0?options.nextCharacterSequence:1;
 let nextEventSequence=Number.isSafeInteger(options.nextEventSequence)&&options.nextEventSequence>0?options.nextEventSequence:1;
 const characters=new Map();
 (Array.isArray(options.characters)?options.characters:[]).forEach(raw=>{
  const character=normaliseCharacter(raw,campaignId);
  if(characters.has(character.id))throw new Error('Duplicate character: '+character.id);
  const prefix='ic:'+campaignId+':character:';
  const sequence=Number(character.id.slice(prefix.length));
  nextCharacterSequence=Math.max(nextCharacterSequence,sequence+1);
  characters.set(character.id,character);
 });
 function add(input){
  const id='ic:'+campaignId+':character:'+nextCharacterSequence;
  const character=normaliseCharacter({...input,id,recruited:true},campaignId);
  nextCharacterSequence+=1;
  characters.set(id,character);
  return clone(character);
 }
 function createEventId(){
  const id='ic:'+campaignId+':event:'+nextEventSequence;
  nextEventSequence+=1;
  return id;
 }
 function get(id){const value=characters.get(id);return value?clone(value):null;}
 function list(){return [...characters.values()].map(clone);}
 function snapshot(){return {version:2,campaignId,nextCharacterSequence,nextEventSequence,characters:list()};}
 return Object.freeze({add,get,list,snapshot,createEventId,getCampaignId:()=>campaignId});
}
function restore(snapshot,options){
 options=options||{};
 if(!snapshot||typeof snapshot!=='object')return create(options);
 const legacy=snapshot.version===1&&!snapshot.campaignId;
 const campaignId=validCampaignId(snapshot.campaignId)?snapshot.campaignId:(validCampaignId(options.campaignId)?options.campaignId:makeCampaignId());
 const warnings=[];
 const characters=[],seen=new Set();
 let highestSequence=0;
 (Array.isArray(snapshot.characters)?snapshot.characters:[]).forEach(raw=>{
  if(!raw||typeof raw!=='object'){warnings.push('Skipped an invalid character record.');return;}
  let candidate=raw;
  if(legacy){
   const match=typeof raw.id==='string'&&/^char-([1-9][0-9]*)$/.exec(raw.id);
   if(!match){warnings.push('Skipped a legacy character without a valid ID.');return;}
   candidate={...raw,id:'ic:'+campaignId+':character:'+match[1]};
  }
  try{
   const character=normaliseCharacter(candidate,campaignId);
   if(seen.has(character.id)){warnings.push('Skipped duplicate character '+character.id+'.');return;}
   seen.add(character.id);
   const prefix='ic:'+campaignId+':character:';
   highestSequence=Math.max(highestSequence,Number(character.id.slice(prefix.length)));
   characters.push(clone(character));
  }catch(_){warnings.push('Skipped an invalid character record.');}
 });
 const savedSequence=legacy?snapshot.nextId:snapshot.nextCharacterSequence;
 const nextCharacterSequence=Math.max(Number.isSafeInteger(savedSequence)&&savedSequence>0?savedSequence:1,highestSequence+1);
 const nextEventSequence=Number.isSafeInteger(snapshot.nextEventSequence)&&snapshot.nextEventSequence>0?snapshot.nextEventSequence:1;
 if(warnings.length&&typeof options.onWarning==='function')options.onWarning(warnings.join(' '));
 return create({campaignId,nextCharacterSequence,nextEventSequence,characters});
}
root.IronCrownCharacters=Object.freeze({create,restore});
})(window);