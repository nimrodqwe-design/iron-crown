const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('js/battle/battle-simulation.js', 'utf8');
const context = { window: {} };
vm.runInNewContext(source, context);
const api = context.window.IronCrownBattleSimulation;
assert.equal(api.MAX_FIELD_TROOPS, 12);

function makeBattle(config) {
  const sim = api.create();
  const ended = [];
  sim.events.on('battle:ended', result => ended.push(result));
  const start = sim.start(config);
  return { sim, start, ended };
}

const { sim, start, ended } = makeBattle({
  battleId: 'reserve-test',
  hero: { attack: 1000, speed: 400 },
  friendly: [{ type: 'foot', count: 20 }, { type: 'archer', count: 4 }],
  enemy: [{ type: 'raider', count: 12, hp: 1, attack: 1 }]
});
assert.equal(start.friendly.length, 12, 'friendly field cap');
assert.equal(start.enemy.length, 12, 'enemy field cap');
assert.equal(start.friendly.reduce((n, unit) => n + (unit.hp > 0 ? 1 : 0), 0), 12);
assert.equal(sim.issueOrder({ battleId: 'reserve-test', order: 'charge' }), false);
assert.equal(sim.issueOrder({ battleId: 'reserve-test', order: 'hold' }), true);
for (let i = 0; i < 4000 && sim.active(); i++) {
  sim.setPlayerInput({ battleId: 'reserve-test', moveY: -1, facingX: 1, facingY: -1, attack: true });
  sim.step(0.05);
}
const result = sim.getResult();
assert.ok(result, 'battle ends');
assert.equal(ended.length, 1, 'battle-ended fires once');
assert.equal(result.survivors.friendly.foot + result.survivors.friendly.archer, 24,
  'all four unfielded archers and eight unfielded foot soldiers remain as reserves plus field survivors unless lost');
assert.equal(result.reserves.friendly.foot, 8, 'friendly foot reserves preserved');
assert.equal(result.reserves.friendly.archer, 4, 'unfielded troop types preserved');
assert.equal(result.survivors.enemy.raider + result.casualties.enemy, 12,
  'enemy fielded survivors plus casualties equal fielded starting count');
assert.equal(result.casualties.friendly + Object.values(result.fieldedSurvivors.friendly).reduce((a,b)=>a+b,0), 12,
  'friendly fielded survivors plus casualties equal fielded starting count');

const wrongBattle = sim.setPlayerInput({ battleId: 'wrong-id', moveX: 1 });
assert.equal(wrongBattle, false, 'stale battle input rejected');
console.log('Battle simulation reserve and contract tests passed.');
