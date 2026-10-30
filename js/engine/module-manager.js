(function(){
'use strict';
function create(services){
 const definitions=new Map(),started=[];
 function register(definition){
  if(!definition||typeof definition.id!=='string'||!definition.id)throw new TypeError('Module requires an id');
  if(definitions.has(definition.id))throw new Error('Duplicate module: '+definition.id);
  if(typeof definition.start!=='function')throw new TypeError('Module '+definition.id+' requires start(services)');
  definitions.set(definition.id,Object.freeze({...definition,dependencies:[...(definition.dependencies||[])]}));
  return definition.id;
 }
 function order(){
  const result=[],temporary=new Set(),permanent=new Set();
  function visit(id){
   if(permanent.has(id))return;
   if(temporary.has(id))throw new Error('Module dependency cycle at '+id);
   const item=definitions.get(id);if(!item)throw new Error('Missing module dependency: '+id);
   temporary.add(id);item.dependencies.forEach(visit);temporary.delete(id);permanent.add(id);result.push(item);
  }
  definitions.forEach((_,id)=>visit(id));return result;
 }
 function startAll(){
  if(started.length)return;
  try{order().forEach(item=>{item.start(services);started.push(item)})}
  catch(error){stopAll();throw error}
 }
 function stopAll(){
  while(started.length){const item=started.pop();if(typeof item.stop==='function'){try{item.stop(services)}catch(error){if(services.events)services.events.emit('engine:module-stop-error',{module:item.id,error})}}}
 }
 function list(){return [...definitions.values()].map(item=>({id:item.id,version:item.version||'1.0.0',dependencies:[...item.dependencies],started:started.some(active=>active.id===item.id)}))}
 return Object.freeze({register,startAll,stopAll,list});
}
window.IronCrownModuleManager=Object.freeze({create});
})();