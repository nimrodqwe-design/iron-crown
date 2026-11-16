'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const sandbox={window:{}};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(__dirname+'/../js/data/world.js','utf8'),sandbox);
const world=sandbox.window.IronCrownWorld;
assert.ok(world,'world catalogue should load');
assert.strictEqual(world.resourceSites.length,12);
const placeIds=new Set(world.places.map(place=>place.id));
const resourceIds=new Set();
for(const site of world.resourceSites){
 assert.ok(!resourceIds.has(site.id),'resource IDs must be unique');
 resourceIds.add(site.id);
 assert.ok(placeIds.has(site.near),'nearest settlement must exist: '+site.id);
 assert.ok(Number.isFinite(site.x)&&site.x>=0&&site.x<=1600);
 assert.ok(Number.isFinite(site.y)&&site.y>=0&&site.y<=1000);
 assert.ok(typeof site.name==='string'&&site.name.trim());
 assert.ok(typeof site.description==='string'&&site.description.trim());
}
assert.strictEqual(world.resourceSites.find(site=>site.id==='larkspur-wool').near,'larkspur');
assert.strictEqual(world.resourceSites.find(site=>site.id==='silverkeep-market').near,'silverkeep');
assert.ok(Object.isFrozen(world.resourceSites));
assert.ok(world.resourceSites.every(Object.isFrozen));
console.log('world resource catalogue checks passed');