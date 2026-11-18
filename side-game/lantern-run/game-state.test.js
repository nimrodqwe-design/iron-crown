'use strict';
const assert=require('node:assert/strict');
const game=require('./game-state.js');
assert.equal(game.LEVEL_COUNT,3);
assert.equal(game.levelName(0),'Broken Nave');
assert.equal(game.levelName(1),'Flooded Archive');
assert.equal(game.levelName(2),'Ashen Gallery');
let s=game.initial();
assert.deepStrictEqual({x:s.x,y:s.y,light:s.light,ended:s.ended},{x:0,y:4,light:12,ended:false});
assert.strictEqual(game.move(s,'left'),s,'blocked movement must preserve the same state object');
assert.strictEqual(game.cellKind(4,0),'goal');
assert.strictEqual(game.cellLabel(4,0),'Exit');
assert.strictEqual(game.cellKind(1,3,0),'trap');
assert.strictEqual(game.cellLabel(1,3,0),'Ruin hazard');
assert.strictEqual(game.cellKind(2,4,1),'trap');
assert.strictEqual(game.cellKind(1,4,2),'trap');
assert.strictEqual(game.cellKind(0,0,2),'floor');
assert.strictEqual(game.cellKind(-1,0,2),null);
const routes=[
 ['up','up','right','right','right','up','up','right'],
 ['up','right','up','right','up','up','right','right'],
 ['up','right','right','right','up','up','right','up']
];
routes.forEach((route,level)=>{
 let run=game.initial(level);
 route.forEach(direction=>{run=game.move(run,direction)});
 assert.equal(run.ended,true,'level '+(level+1)+' route should end');
 assert.equal(run.outcome,'escaped','level '+(level+1)+' route should reach the exit');
 assert.equal(run.light,4,'all layouts should be solvable within the lantern budget');
 assert.equal(run.moves,8);
});
s=game.initial();s=game.move(s,'right');s=game.move(s,'up');
assert.strictEqual(s.light,10);assert.strictEqual(s.ended,true);assert.strictEqual(s.outcome,'trapped');
const darkness={...game.initial(),light:1};
assert.equal(game.move(darkness,'right').outcome,'darkness','a safe move that uses the final light ends the run');
const frozen=game.move(s,'left');assert.deepStrictEqual(frozen,s,'ended games must be stable');
const invalidState=game.initial();
assert.strictEqual(game.move(invalidState,'invalid'),invalidState,'invalid directions must preserve state');
assert.equal(game.initial(99).level,0,'invalid level indexes fall back safely');
console.log('Lantern Run state checks passed');
