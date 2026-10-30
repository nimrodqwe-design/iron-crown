(function(){
'use strict';
function create(){
 const groups=new Map();
 function register(type,id,value){
  if(typeof type!=='string'||!type||typeof id!=='string'||!id)throw new TypeError('Registry type and id are required');
  if(!groups.has(type))groups.set(type,new Map());
  const group=groups.get(type);
  if(group.has(id))throw new Error('Duplicate registry entry: '+type+'/'+id);
  group.set(id,value);return value;
 }
 function get(type,id){return groups.get(type)?.get(id)}
 function list(type){return [...(groups.get(type)?.entries()||[])].map(([id,value])=>({id,value}))}
 function has(type,id){return groups.get(type)?.has(id)||false}
 return Object.freeze({register,get,list,has});
}
window.IronCrownRegistry=Object.freeze({create});
})();