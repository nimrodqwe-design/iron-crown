(function(){
'use strict';
const initialState=()=>({current:'greyhaven',freePosition:null,gold:85,troops:12,health:100,supplies:5,discoveries:[],houseStanding:{alder:0,veyne:0,rowan:0},audiences:[],day:1,minutes:480,target:null,progress:0,from:null,to:null,paused:false,camped:false,speed:1,zoom:1,panX:0,panY:0,last:0});
window.IronCrownState=Object.freeze({createInitialState:initialState,saveVersion:3});
})();
