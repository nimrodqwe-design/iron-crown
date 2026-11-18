(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.LanternRunState=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SIZE=5;
  const START=Object.freeze({x:0,y:4});
  const GOAL=Object.freeze({x:4,y:0});
  const LEVELS=Object.freeze([
    Object.freeze({name:'Broken Nave',traps:new Set(['1,3','3,3','2,1','4,2'])}),
    Object.freeze({name:'Flooded Archive',traps:new Set(['2,4','2,3','1,1','3,1'])}),
    Object.freeze({name:'Ashen Gallery',traps:new Set(['1,4','2,2','4,2','0,1'])})
  ]);
  const key=(x,y)=>x+','+y;
  const normaliseLevel=level=>Number.isInteger(level)&&level>=0&&level<LEVELS.length?level:0;
  function initial(level=0){
    const selected=normaliseLevel(level);
    return {level:selected,x:START.x,y:START.y,light:12,moves:0,ended:false,outcome:null};
  }
  function levelName(level){return LEVELS[normaliseLevel(level)].name}
  function cellKind(x,y,level=0){
    if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=SIZE||y>=SIZE)return null;
    if(x===GOAL.x&&y===GOAL.y)return 'goal';
    if(LEVELS[normaliseLevel(level)].traps.has(key(x,y)))return 'trap';
    return 'floor';
  }
  function cellLabel(x,y,level=0){
    const kind=cellKind(x,y,level);
    return kind==='goal'?'Exit':kind==='trap'?'Ruin hazard':kind==='floor'?'Stone floor':null;
  }
  function move(state,dir){
    if(!state||typeof state!=='object'||state.ended)return state;
    if(!Number.isInteger(state.x)||!Number.isInteger(state.y)||!Number.isFinite(state.light))return state;
    const delta={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[dir];
    if(!delta)return state;
    const x=state.x+delta[0],y=state.y+delta[1];
    if(x<0||y<0||x>=SIZE||y>=SIZE)return state;
    const next={...state,x,y,light:state.light-1,moves:(Number.isInteger(state.moves)?state.moves:0)+1};
    if(x===GOAL.x&&y===GOAL.y)return {...next,ended:true,outcome:'escaped'};
    if(cellKind(x,y,state.level)==='trap')return {...next,ended:true,outcome:'trapped'};
    if(next.light<=0)return {...next,ended:true,outcome:'darkness'};
    return next;
  }
  return Object.freeze({SIZE,START,GOAL,LEVEL_COUNT:LEVELS.length,initial,move,cellKind,cellLabel,levelName});
});
