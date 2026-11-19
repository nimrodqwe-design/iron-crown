(function(root){
'use strict';
function create(options){
 options=options||{};
 const roster=options.roster;
 const getActiveIds=options.getActiveIds;
 const setActiveIds=options.setActiveIds;
 const maxSize=Number.isInteger(options.maxSize)?Math.max(1,Math.min(12,options.maxSize)):4;
 if(!roster||typeof roster.list!=='function'||typeof roster.get!=='function')throw new TypeError('A campaign character roster is required');
 if(typeof getActiveIds!=='function'||typeof setActiveIds!=='function')throw new TypeError('Active-party state accessors are required');
 function normalise(){
  const known=new Set(roster.list().filter(character=>character.status!=='recovering').map(character=>character.id));
  const source=getActiveIds();
  const ids=[];
  if(Array.isArray(source))source.forEach(id=>{
   if(typeof id==='string'&&known.has(id)&&!ids.includes(id)&&ids.length<maxSize)ids.push(id);
  });
  if(!Array.isArray(source)||source.length!==ids.length||source.some((id,index)=>id!==ids[index]))setActiveIds(ids);
  return ids;
 }
 function assign(id){
  const character=typeof id==='string'?roster.get(id):null;
  if(!character)return {ok:false,reason:'That character is not in your roster'};
  if(character.status==='recovering')return {ok:false,reason:'That character is recovering and cannot join the active party'};
  const ids=normalise();
  if(ids.includes(id))return {ok:false,reason:'That character is already in the active party'};
  if(ids.length>=maxSize)return {ok:false,reason:'The active party is full'};
  const next=[...ids,id];
  setActiveIds(next);
  return {ok:true,activePartyIds:next.slice(),character:roster.get(id)};
 }
 function remove(id){
  const ids=normalise();
  if(!ids.includes(id))return {ok:false,reason:'That character is not in the active party'};
  const next=ids.filter(value=>value!==id);
  setActiveIds(next);
  return {ok:true,activePartyIds:next.slice(),character:roster.get(id)};
 }
 function list(){
  const activeIds=new Set(normalise());
  return roster.list().map(character=>({...character,active:activeIds.has(character.id)}));
 }
 function active(){return normalise().map(id=>roster.get(id)).filter(Boolean)}
 return Object.freeze({assign,remove,list,active,get maxSize(){return maxSize}});
}
root.IronCrownParty=Object.freeze({create});
})(window);
