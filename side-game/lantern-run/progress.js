(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.LanternRunProgress=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';
  const KEY='lanternRunRecordsV1';
  const LEVEL_COUNT=4;
  const validLevel=level=>Number.isInteger(level)&&level>=0&&level<LEVEL_COUNT;
  function create(storage){
    let backend=storage;
    if(arguments.length===0){
      try{backend=root.localStorage||null}catch(_){backend=null}
    }
    let scores=Array(LEVEL_COUNT).fill(null);
    let persisted=Array(LEVEL_COUNT).fill(false);
    try{
      const raw=backend&&backend.getItem(KEY);
      if(raw){
        const parsed=JSON.parse(raw);
        if(parsed&&parsed.version===1&&Array.isArray(parsed.bestScores)&&parsed.bestScores.length<=LEVEL_COUNT){
          scores=scores.map((_,index)=>{
            const value=parsed.bestScores[index];
            return Number.isInteger(value)&&value>=0&&value<=10000?value:null;
          });
          persisted=scores.map(value=>value!==null);
        }
      }
    }catch(_){}
    function best(level){return validLevel(level)?scores[level]:null}
    function record(level,value){
      if(!validLevel(level)||!Number.isInteger(value)||value<0||value>10000)
        return {ok:false,updated:false,best:best(level),persisted:false};
      const previous=scores[level];
      if(previous!==null&&value<=previous)
        return {ok:true,updated:false,best:previous,persisted:persisted[level]};
      scores[level]=value;
      let saved=false;
      try{
        if(backend&&typeof backend.setItem==='function'){
          backend.setItem(KEY,JSON.stringify({version:1,bestScores:scores}));
          saved=true;
        }
      }catch(_){}
      persisted[level]=saved;
      return {ok:true,updated:true,best:value,persisted:saved};
    }
    function snapshot(){return {version:1,bestScores:scores.slice()}}
    return Object.freeze({best,record,snapshot});
  }
  return Object.freeze({KEY,LEVEL_COUNT,create});
});