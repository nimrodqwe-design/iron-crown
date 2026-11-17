(function(root){
'use strict';
const candidates=[
 {id:'mara-kingsbridge',settlementId:'kingsbridge',name:'Mara Venn',role:'companion',background:'Former caravan guard who knows the river roads.',motivation:'loyalty',baseCost:34,trust:68,available:true,requirements:{}},
 {id:'iven-highcourt',settlementId:'highcourt',name:'Iven Rook',role:'officer',background:'A disciplined border scout who reads tracks and weather.',motivation:'glory',baseCost:40,trust:58,available:true,requirements:{}},
 {id:'sella-silverkeep',settlementId:'silverkeep',name:'Sella Quill',role:'specialist',background:'A travelling archivist who studies old Marcher claims.',motivation:'knowledge',baseCost:32,trust:82,available:true,requirements:{}}
];
const ids=new Set();
candidates.forEach(candidate=>{
 if(!candidate.id||!candidate.settlementId||ids.has(candidate.id))throw new Error('Invalid or duplicate named recruit candidate');
 ids.add(candidate.id);
});
root.IronCrownRecruitCandidates=Object.freeze(candidates.map(candidate=>Object.freeze({...candidate,requirements:Object.freeze({...candidate.requirements})})));
})(window);
