(function(root){
'use strict';
const MATERIALS=Object.freeze({grain:'Grain',timber:'Timber',fish:'Fish',stone:'Stone',salt:'Salt',reeds:'Reeds',iron:'Iron',ore:'Ore',wool:'Wool'});
const STOCK_BY_AVAILABILITY=Object.freeze({Abundant:24,Steady:18,Seasonal:12,Valuable:15,Limited:6,Busy:0});
const CAPACITY=99,BATCH_SIZE=3,GATHER_MINUTES=60,MAX_DISTANCE=45;
const materialKeys=Object.keys(MATERIALS);
function stockFor(site){
 if(!site||!Object.prototype.hasOwnProperty.call(MATERIALS,site.type))return 0;
 return STOCK_BY_AVAILABILITY[site.availability]||0;
}
function createInitialState(sites){
 const resourceStock={};
 (Array.isArray(sites)?sites:[]).forEach(site=>{if(site&&typeof site.id==='string')resourceStock[site.id]=stockFor(site)});
 const rawMaterials={};
 materialKeys.forEach(type=>{rawMaterials[type]=0});
 return {resourceStock,rawMaterials};
}
function restore(snapshot,sites){
 const restored=createInitialState(sites);
 const source=snapshot&&typeof snapshot==='object'?snapshot:{};
 const sourceStock=source.resourceStock&&typeof source.resourceStock==='object'?source.resourceStock:{};
 const sourceMaterials=source.rawMaterials&&typeof source.rawMaterials==='object'?source.rawMaterials:{};
 (Array.isArray(sites)?sites:[]).forEach(site=>{
  if(!site||typeof site.id!=='string')return;
  const value=sourceStock[site.id],maximum=stockFor(site);
  restored.resourceStock[site.id]=Number.isFinite(value)?Math.max(0,Math.min(maximum,Math.floor(value))):maximum;
 });
 materialKeys.forEach(type=>{
  const value=sourceMaterials[type];
  restored.rawMaterials[type]=Number.isFinite(value)?Math.max(0,Math.min(CAPACITY,Math.floor(value))):0;
 });
 return restored;
}
function snapshot(state,sites){
 return restore({resourceStock:state&&state.resourceStock,rawMaterials:state&&state.rawMaterials},sites);
}
function inspect(options){
 options=options||{};
 const state=options.state,sites=Array.isArray(options.sites)?options.sites:[];
 const site=sites.find(item=>item&&item.id===options.siteId)||null;
 if(!site)return {ok:false,canGather:false,canTravel:false,reason:'Unknown resource site.'};
 const resource=Object.prototype.hasOwnProperty.call(MATERIALS,site.type)?site.type:null;
 const position=options.position,validPosition=position&&Number.isFinite(position.x)&&Number.isFinite(position.y);
 const distance=validPosition?Math.hypot(site.x-position.x,site.y-position.y):Infinity;
 const withinRange=distance<=MAX_DISTANCE,blocked=!!options.blocked;
 const stockValue=state&&state.resourceStock&&state.resourceStock[site.id];
 const carriedValue=resource&&state&&state.rawMaterials&&state.rawMaterials[resource];
 const stock=Number.isFinite(stockValue)?Math.max(0,Math.floor(stockValue)):stockFor(site);
 const carried=Number.isFinite(carriedValue)?Math.max(0,Math.min(CAPACITY,Math.floor(carriedValue))):0;
 const amount=resource?Math.max(0,Math.min(BATCH_SIZE,stock,CAPACITY-carried)):0;
 const canGather=!!resource&&!blocked&&withinRange&&stock>0&&carried<CAPACITY&&amount>0;
 const canTravel=!!resource&&!blocked&&!withinRange&&stock>0&&carried<CAPACITY;
 let reason='Ready to gather '+amount+' '+MATERIALS[resource]+'. Takes one hour.';
 if(!resource)reason='This trade yard is not gatherable.';
 else if(blocked)reason='Gathering and travel are unavailable during travel or battle.';
 else if(!validPosition)reason='Current campaign position is unavailable.';
 else if(!withinRange)reason='Move within '+MAX_DISTANCE+' map units to gather.';
 else if(stock<=0)reason='This site is depleted.';
 else if(carried>=CAPACITY)reason='Your '+MATERIALS[resource]+' carrying capacity is full.';
 return {ok:canGather,canGather,canTravel,siteId:site.id,resource,label:resource?MATERIALS[resource]:null,stock,maxStock:stockFor(site),carried,capacity:CAPACITY,distance,withinRange,amount,reason};
}
function gather(options){
 options=options||{};
 const state=options.state,sites=Array.isArray(options.sites)?options.sites:[];
 if(!state||typeof state!=='object')return {ok:false,reason:'Campaign state is unavailable.'};
 if(!state.resourceStock||typeof state.resourceStock!=='object')state.resourceStock=createInitialState(sites).resourceStock;
 if(!state.rawMaterials||typeof state.rawMaterials!=='object')state.rawMaterials=createInitialState(sites).rawMaterials;
 const ready=inspect(options);
 if(!ready.canGather)return {ok:false,reason:ready.reason};
 if(typeof options.advanceTime!=='function')return {ok:false,reason:'Campaign time service is unavailable.'};
 const elapsed=options.advanceTime(GATHER_MINUTES);
 if(elapsed===false||(elapsed&&elapsed.ok===false))return {ok:false,reason:elapsed&&elapsed.reason?elapsed.reason:'Campaign time could not advance.'};
 state.resourceStock[ready.siteId]=ready.stock-ready.amount;
 state.rawMaterials[ready.resource]=ready.carried+ready.amount;
 return {ok:true,siteId:ready.siteId,resource:ready.resource,label:ready.label,amount:ready.amount,remainingStock:state.resourceStock[ready.siteId],carried:state.rawMaterials[ready.resource],capacity:CAPACITY,day:state.day,minutes:state.minutes,minutesSpent:GATHER_MINUTES};
}
root.IronCrownCampaignResources=Object.freeze({MATERIALS,STOCK_BY_AVAILABILITY,CAPACITY,BATCH_SIZE,GATHER_MINUTES,MAX_DISTANCE,createInitialState,restore,snapshot,inspect,gather});
})(window);
