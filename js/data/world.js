(function(){
'use strict';
const places=[
{id:'greyhaven',name:'Greyhaven',kind:'village',faction:'Crownlands',x:210,y:220,desc:'A quiet riverside village known for barley fields and sturdy cartwrights.',prosperity:'Modest',garrison:0},
{id:'oakrest',name:'Oakrest',kind:'village',faction:'Crownlands',x:430,y:300,desc:'A timber village on the old king road, surrounded by dense woodland.',prosperity:'Stable',garrison:0},
{id:'kingsbridge',name:'Kingsbridge',kind:'town',faction:'Crownlands',x:650,y:220,desc:'A busy market town controlling the northern bridge and grain trade.',prosperity:'Wealthy',garrison:85},
{id:'stonewatch',name:'Stonewatch',kind:'castle',faction:'Crownlands',x:900,y:330,desc:'A fortified seat overlooking the road into the central marches.',prosperity:'Stable',garrison:140},
{id:'westmere',name:'Westmere',kind:'village',faction:'Crownlands',x:300,y:760,desc:'A fishing and farming settlement near the western shore.',prosperity:'Modest',garrison:0},
{id:'thornfield',name:'Thornfield',kind:'village',faction:'Crownlands',x:510,y:540,desc:'A farming village whose hedgerows make it difficult to approach unseen.',prosperity:'Modest',garrison:0},
{id:'highcourt',name:'Highcourt',kind:'town',faction:'Crownlands',x:760,y:650,desc:'A prosperous crossroads town with smiths, traders and a small garrison.',prosperity:'Wealthy',garrison:110},
{id:'redvale',name:'Redvale',kind:'village',faction:'Ashen League',x:1190,y:270,desc:'A border village whose fields have changed hands more than once.',prosperity:'Strained',garrison:0},
{id:'brackenford',name:'Brackenford',kind:'village',faction:'Ashen League',x:1020,y:720,desc:'A marsh-edge settlement supplying peat, reeds and river boats.',prosperity:'Stable',garrison:0},
{id:'dunmar',name:'Dunmar',kind:'town',faction:'Ashen League',x:1390,y:430,desc:'A walled trading town where northern iron meets southern wine.',prosperity:'Wealthy',garrison:95},
{id:'ironholt',name:'Ironholt',kind:'castle',faction:'Ashen League',x:1280,y:830,desc:'A stern fortress guarding the eastern approaches and the lower river.',prosperity:'Stable',garrison:175},
{id:'merewatch',name:'Merewatch',kind:'village',faction:'Ashen League',x:1160,y:570,desc:'A reed-cutter village built around a shallow lake.',prosperity:'Modest',garrison:0},
{id:'northpass',name:'Northpass',kind:'castle',faction:'Free Marches',x:1240,y:120,desc:'A mountain fortress controlling the high pass through the northern range.',prosperity:'Stable',garrison:160},
{id:'larkspur',name:'Larkspur',kind:'village',faction:'Free Marches',x:1450,y:650,desc:'A remote upland village known for wool and hardy horses.',prosperity:'Modest',garrison:0},
{id:'silverkeep',name:'Silverkeep',kind:'town',faction:'Free Marches',x:1050,y:470,desc:'A neutral market town where envoys from all three powers meet.',prosperity:'Prosperous',garrison:70}
];;
const discoveries=[
 {id:"watchtower",name:"The King's Watch",x:335,y:455,description:"An abandoned royal watchtower. Its sealed archive holds the first proof that the old Crown passed to no recognised heir.",gold:12,relic:"Royal Seal"},
 {id:"shrine",name:"The Pilgrim's Oath",x:850,y:835,description:"A secluded shrine preserves the oath sworn by the founders of the Marches. Its inscription names the duties of whoever would wear the Crown.",gold:8,relic:"Founder's Oath"},
 {id:"cache",name:"The Crown Ledger",x:1370,y:565,description:"A hidden royal courier cache contains the last ledger of loyal houses and their pledges to the Crown.",gold:20,relic:"Loyal Houses Ledger"}
];;
window.IronCrownWorld=Object.freeze({places:Object.freeze(places),discoveries:Object.freeze(discoveries)});
})();
