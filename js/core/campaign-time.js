(function(root){
'use strict';
const DAY_MINUTES=1440;
function canAdvance(state,minutes){
 return !!state&&Number.isSafeInteger(state.day)&&state.day>0&&
  Number.isFinite(state.minutes)&&state.minutes>=0&&state.minutes<DAY_MINUTES&&
  Number.isFinite(minutes)&&minutes>=0&&Number.isFinite(state.minutes+minutes);
}
function advance(state,minutes){
 if(!canAdvance(state,minutes))return {ok:false,reason:'Campaign time is invalid.'};
 const total=state.minutes+minutes;
 const days=Math.floor(total/DAY_MINUTES);
 state.day+=days;
 state.minutes=total-days*DAY_MINUTES;
 return {ok:true,daysAdvanced:days,day:state.day,minutes:state.minutes};
}
root.IronCrownCampaignTime=Object.freeze({DAY_MINUTES,canAdvance,advance});
})(window);
