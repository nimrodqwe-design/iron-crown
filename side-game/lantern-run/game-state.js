(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.LanternRunState=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SIZE=5;
  const START=Object.freeze({x:0,y:4});
  const GOAL=Object.freeze({x:4,y:0});
  const TRAPS=new Set(['1,3','3,3','2,1','4,2']);
  const key=(x,y)=>x+','+y;
  function initial(){return {x:START.x,y:START.y,light:12,ended:false,outcome:null};}
  function move(state,dir){
    if(!state||state.ended) return state;
    const delta={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[dir];
    if(!delta) return state;
    const x=state.x+delta[0], y=state.y+delta[1];
    if(x<0||y<0||x>=SIZE||y>=SIZE) return {...state};
    const next={...state,x,y,light:state.light-1};
    if(x===GOAL.x&&y===GOAL.y) return {...next,ended:true,outcome:'escaped'};
    if(TRAPS.has(key(x,y))) return {...next,ended:true,outcome:'trapped'};
    if(next.light<=0) return {...next,ended:true,outcome:'darkness'};
    return next;
  }
  return Object.freeze({SIZE,START,GOAL,initial,move});
});
