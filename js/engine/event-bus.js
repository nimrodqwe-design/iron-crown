(function(){
'use strict';
function create(){
 const listeners=new Map();
 function on(name,handler){
  if(typeof name!=='string'||!name||typeof handler!=='function')throw new TypeError('Event name and handler are required');
  if(!listeners.has(name))listeners.set(name,new Set());
  listeners.get(name).add(handler);
  return ()=>off(name,handler);
 }
 function off(name,handler){const group=listeners.get(name);if(!group)return false;const removed=group.delete(handler);if(!group.size)listeners.delete(name);return removed}
 function emit(name,payload){const group=listeners.get(name);if(!group)return 0;let count=0;[...group].forEach(handler=>{handler(payload);count++});return count}
 function clear(){listeners.clear()}
 return Object.freeze({on,off,emit,clear});
}
window.IronCrownEventBus=Object.freeze({create});
})();