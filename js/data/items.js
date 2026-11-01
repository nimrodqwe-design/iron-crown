(function(){
'use strict';
const items={
'worn-blade':{id:'worn-blade',name:'Worn blade',slot:'weapon',price:0,attack:1,defence:0,shop:false},
'travel-cloak':{id:'travel-cloak',name:'Travel cloak',slot:'armour',price:0,attack:0,defence:1,shop:false},
'worn-sword':{id:'worn-sword',name:'Worn sword',slot:'weapon',price:18,attack:2,defence:0,shop:true},
'iron-sword':{id:'iron-sword',name:'Iron sword',slot:'weapon',price:35,attack:4,defence:0,shop:true},
'padded-armour':{id:'padded-armour',name:'Padded armour',slot:'armour',price:28,attack:0,defence:3,shop:true},
'round-shield':{id:'round-shield',name:'Round shield',slot:'offhand',price:25,attack:0,defence:2,shop:true}
};
window.IronCrownItems=Object.freeze(items);
})();