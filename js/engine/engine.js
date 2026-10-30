(function(){
'use strict';
const events=window.IronCrownEventBus.create();
const registry=window.IronCrownRegistry.create();
const services=Object.freeze({events,registry});
const modules=window.IronCrownModuleManager.create(services);
const engine=Object.freeze({
 version:'1.0.0',
 events,
 registry,
 registerModule:definition=>modules.register(definition),
 start:()=>modules.startAll(),
 stop:()=>modules.stopAll(),
 modules:()=>modules.list()
});
window.IronCrownEngine=engine;
})();