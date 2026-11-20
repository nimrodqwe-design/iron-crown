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
assert.equal(result.survivors.friendly.foot + result.survivors.friendly.archer + result.casualties.friendly, 24,
  'friendly survivors plus field casualties preserve the full campaign roster');
assert.equal(result.reserves.friendly.foot, 8, 'friendly foot reserves preserved');
assert.equal(result.reserves.friendly.archer, 4, 'unfielded troop types preserved');
assert.equal(result.survivors.enemy.raider + result.casualties.enemy, 12,
  'enemy fielded survivors plus casualties equal fielded starting count');
assert.equal(result.casualties.friendly + Object.values(result.fieldedSurvivors.friendly).reduce((a,b)=>a+b,0), 12,
  'friendly fielded survivors plus casualties equal fielded starting count');

const wrongBattle = sim.setPlayerInput({ battleId: 'wrong-id', moveX: 1 });
assert.equal(wrongBattle, false, 'stale battle input rejected');
const namedSim=api.create();
const namedStarted=namedSim.start({
 battleId:'named-retreat',
 participantIds:['ic:campaign:character:1','unknown'],
 friendly:[{id:'mara-group',characterId:'ic:campaign:character:1',name:'Mara Venn',type:'named',count:1},{id:'foot-group',type:'foot',count:2}],
 enemy:[{id:'raiders',type:'raider',count:2}]
});
assert.deepEqual(JSON.parse(JSON.stringify(namedStarted.friendly.filter(unit=>unit.characterId).map(unit=>unit.characterId))),['ic:campaign:character:1']);
assert.equal(namedStarted.friendly.find(unit=>unit.characterId).name,'Mara Venn','named battle participants retain their display names for the renderer');
const namedResult=namedSim.retreat();
assert.equal(namedResult.outcome,'defeat');
assert.equal(namedResult.reason,'retreated');
assert.deepEqual(JSON.parse(JSON.stringify(namedResult.participantIds)),['ic:campaign:character:1']);
assert.equal(namedResult.characterOutcomes.length,1);
assert.equal(namedResult.characterOutcomes[0].characterId,'ic:campaign:character:1');
assert.equal(namedResult.characterOutcomes[0].alive,true);
assert.equal(namedSim.retreat(),null,'a finished battle cannot be retreated twice');


const checkpointSource=api.create();
checkpointSource.start({battleId:'checkpoint-battle',friendly:[{id:'guard',type:'foot',count:2}],enemy:[{id:'raiders',type:'raider',count:2}]});
checkpointSource.issueOrder({battleId:'checkpoint-battle',order:'hold'});
checkpointSource.setPlayerInput({battleId:'checkpoint-battle',moveX:1,moveY:0,facingX:1,facingY:0});
checkpointSource.step(.05);
const checkpoint=checkpointSource.serialize();
assert.ok(checkpoint&&checkpoint.version===1,'active simulation can be serialized');
const checkpointTarget=api.create();
assert.equal(checkpointTarget.restore(checkpoint),true,'active simulation checkpoint restores');
assert.deepEqual(JSON.parse(JSON.stringify(checkpointTarget.snapshot())),JSON.parse(JSON.stringify(checkpointSource.snapshot())));
checkpointSource.step(.05);checkpointTarget.step(.05);
assert.deepEqual(JSON.parse(JSON.stringify(checkpointTarget.snapshot())),JSON.parse(JSON.stringify(checkpointSource.snapshot())),'restored simulation continues deterministically');
assert.equal(checkpointTarget.restore({version:1,battle:{phase:'active'}}),false,'malformed checkpoints are rejected');

console.log('Battle simulation reserve, checkpoint and contract tests passed.');
