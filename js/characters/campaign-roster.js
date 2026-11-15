(function(){
'use strict';
const VALID_ROLES=new Set(['companion','officer','specialist']);
function clone(value){return JSON.parse(JSON.stringify(value));}
function normaliseCharacter(input){
 if(!input||typeof input!=='object')throw new TypeError('Character is required');
 if(typeof input.id!=='string'||!/^char-[1-9][0-9]*$/.test(input.id))throw new TypeError('Character requires a stable char-N id');
 const role=VALID_ROLES.has(input.role)?input.role:'companion';
 return Object.freeze({
  id:input.id,
  name:String(input.name||'Unknown character'),
  role,
  recruited:input.recruited!==false,
  motivation:typeof input.motivation==='string'?input.motivation:'coin',
  trust:Number.isFinite(input.trust)?Math.max(0,Math.min(100,input.trust)):50,
  morale:Number.isFinite(input.morale)?Math.max(0,Math.min(100,input.morale)):60
 });
}
function create(options){
 options=options||{};
 let nextId=Number.isInteger(options.nextId)&&options.nextId>0?options.nextId:1;
 const characters=new Map();
 (Array.isArray(options.characters)?options.characters:[]).forEach(raw=>{
  const character=normaliseCharacter(raw);
  if(characters.has(character.id))throw new Error('Duplicate character: '+character.id);
  const numeric=Number(character.id.slice(5));nextId=Math.max(nextId,numeric+1);
  characters.set(character.id,character);
 });
 function add(input){
  const id='char-'+nextId++;
  const character=normaliseCharacter({...input,id,recruited:true});
  characters.set(id,character);
  return clone(character);
 }
 function get(id){const value=characters.get(id);return value?clone(value):null;}
 function list(){return [...characters.values()].map(clone);}
 function snapshot(){return {version:1,nextId,characters:list()};}
 return Object.freeze({add,get,list,snapshot});
}
function restore(snapshot){
 if(!snapshot||typeof snapshot!=='object')return create();
 return create({nextId:snapshot.nextId,characters:snapshot.characters});
}
window.IronCrownCharacters=Object.freeze({create,restore});
})();