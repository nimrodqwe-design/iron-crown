const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context={window:{}};
vm.runInNewContext(fs.readFileSync('js/characters/loyalty.js','utf8'),context);
const api=context.window.IronCrownLoyalty;
const game=api.create({recruits:[
 {id:'coin',name:'Coin Mercenary',motivation:'coin',trust:50,morale:50},
 {id:'guard',name:'Cautious Guard',motivation:'safety',trust:50,morale:50},
 {id:'scholar',name:'Travelling Scholar',motivation:'knowledge',trust:50,morale:50},
 {id:'loyal',name:'Oathkeeper',motivation:'loyalty',trust:50,morale:50}
]});
const before=game.getStanding('coin');
assert.equal(game.recordAction('coin','paid','pay-1').ok,true);
assert.ok(game.getStanding('coin').morale>before.morale,'paying a coin-motivated recruit improves morale');
const paid=game.getStanding('coin');
assert.equal(game.recordAction('coin','paid','pay-1').duplicate,true);
assert.equal(game.getStanding('coin').morale,paid.morale,'duplicate event must not apply twice');
const guard=game.getStanding('guard');
game.recordAction('guard','protected','guard-1');
assert.ok(game.getStanding('guard').trust>guard.trust,'protection builds safety-motivated trust');
const scholar=game.getStanding('scholar');
game.recordAction('scholar','training','study-1');
assert.ok(game.getStanding('scholar').morale>scholar.morale,'training motivates knowledge-seeking recruit');
const loyal=game.getStanding('loyal');
game.recordAction('loyal','broken_promise','promise-1');
assert.ok(game.getStanding('loyal').trust<loyal.trust-5,'breaking a promise damages an oath-driven recruit more');
assert.equal(game.recordAction('missing','paid','x').ok,false);
assert.equal(game.recordAction('coin','teleport','x').ok,false);
assert.equal(game.recordAction('coin','paid','').ok,false);
const saved=game.snapshot();
const restored=api.create({recruits:saved.recruits});
assert.deepEqual(JSON.parse(JSON.stringify(restored.snapshot())),JSON.parse(JSON.stringify(saved)),'trust, morale and event deduplication survive save/restore');
assert.equal(restored.recordAction('coin','paid','pay-1').duplicate,true,'restored event IDs prevent replay');
assert.equal(game.addRecruit({id:'coin'}),false,'duplicate stable IDs are rejected');
assert.equal(game.addRecruit({id:'new',motivation:'glory'}),true);
console.log('Recruit loyalty and motivation tests passed.');
