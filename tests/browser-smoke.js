'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8'};
function createServer(){
 return http.createServer((request,response)=>{
  let pathname;
  try{pathname=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname)}catch(_){response.writeHead(400);response.end('Bad request');return;}
  if(pathname==='/')pathname='/index.html';
  const filename=path.resolve(ROOT,'.'+pathname);
  if(filename!==ROOT&&!filename.startsWith(ROOT+path.sep)){response.writeHead(403);response.end('Forbidden');return;}
  fs.readFile(filename,(error,data)=>{
   if(error){response.writeHead(404);response.end('Not found');return;}
   response.writeHead(200,{'content-type':mime[path.extname(filename)]||'application/octet-stream','cache-control':'no-store'});
   response.end(data);
  });
 });
}
async function run(){
 const seed={
  version:11,
  state:{
   current:'kingsbridge',freePosition:null,gold:85,troops:12,health:100,day:1,minutes:480,camped:false,supplies:5,lastCompanionPayDay:0,
   inventory:['worn-blade','travel-cloak'],equipment:{weapon:'worn-blade',armour:'travel-cloak',offhand:null},
   discoveries:[],defeatedParties:[],metCaravans:[],houseStanding:{alder:0,veyne:0,rowan:0},audiences:[],
   activePartyIds:[],activeBattle:null,resolvedBattleIds:[],resolvedCampaignEventIds:[],
   characterRoster:{version:2,campaignId:'browser-smoke',nextCharacterSequence:1,nextEventSequence:1,characters:[]}
  }
 };
 const server=createServer();
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 const address=server.address(),url='http://127.0.0.1:'+address.port+'/';
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];
  page.setDefaultTimeout(10000);
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(value=>{if(!sessionStorage.getItem('ironCrownBrowserSeeded')){localStorage.setItem('ironCrownSave',value);sessionStorage.setItem('ironCrownBrowserSeeded','1')}},JSON.stringify(seed));
  await page.goto(url,{waitUntil:'load'});
  await page.locator('.settlement[aria-label="Kingsbridge"]').waitFor();
  assert.equal(await page.locator('#clock').textContent(),'DAY 1 · 08:00','the seeded campaign save loads');
  await page.locator('.settlement[aria-label="Kingsbridge"]').click();
  await page.locator('#visit').click();
  await page.locator('#namedRecruitList button').first().waitFor();
  assert.match(await page.locator('#namedRecruitList').textContent(),/Mara Venn/,'Kingsbridge exposes its named candidate');
  await page.locator('#namedRecruitList button').first().click();
  assert.match(await page.locator('#townNote').textContent(),/Mara Venn joined your company/,'the candidate is recruited through the settlement UI');
  await page.locator('#townClose').click();

  await page.locator('#companyButton').click();
  await page.locator('#availablePartyList button').first().waitFor();
  await page.locator('#availablePartyList button').filter({hasText:'Add to party'}).first().click();
  assert.equal(await page.locator('#activePartyCount').textContent(),'1/4','the recruited character joins the active party');
  const goldBeforePay=Number(await page.locator('#gold').textContent());
  const pay=page.locator('#payCompanions');
  assert.equal(await pay.isDisabled(),false,'daily pay is available for the active named party');
  assert.match(await pay.textContent(),/5 gold/);
  await pay.click();
  assert.equal(Number(await page.locator('#gold').textContent()),goldBeforePay-5,'daily pay deducts exactly five gold for one active companion');
  assert.equal(await pay.isDisabled(),true,'the party cannot be paid twice on the same campaign day');
  assert.match(await page.locator('#companyNote').textContent(),/Daily wages paid/);

  await page.locator('#companyClose').click();
  await page.locator('#camp').click();
  await page.locator('#companyButton').click();
  assert.equal(await page.locator('#trainCompanions').isDisabled(),false,'camp training becomes available after establishing camp');
  await page.locator('#trainCompanions').click();
  assert.match(await page.locator('#companyNote').textContent(),/Camp training complete/);
  assert.equal(await page.locator('#clock').textContent(),'DAY 1 · 09:00','training advances one campaign hour');

  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('ironCrownSave')));
  assert.equal(saved.version,12);
  assert.equal(saved.state.resourceStock['greyhaven-grain'],24);
  assert.equal(saved.state.rawMaterials.grain,0);
  assert.equal(saved.state.lastCompanionPayDay,1);
  assert.equal(saved.state.supplies,3);
  assert.equal(saved.state.minutes,540);
  assert.equal(saved.state.activePartyIds.length,1);
  assert.equal(saved.state.characterRoster.characters[0].name,'Mara Venn');
  const expectedGold=Number(await page.locator('#gold').textContent());
  await page.reload({waitUntil:'load'});
  assert.equal(await page.locator('#clock').textContent(),'DAY 1 · 09:00','campaign time survives browser reload');
  await page.locator('#companyButton').click();
  assert.equal(await page.locator('#activePartyCount').textContent(),'1/4','active-party membership survives browser reload');
  assert.match(await page.locator('#activePartyList').textContent(),/Mara Venn/);
  assert.equal(await page.locator('#payCompanions').isDisabled(),true,'the daily payment guard survives browser reload');
  assert.equal(await page.locator('#trainCompanions').isDisabled(),false,'camp state and remaining supplies survive browser reload');
  assert.equal(Number(await page.locator('#gold').textContent()),expectedGold);
  const standing=await page.locator('#activePartyList .named-recruit-card p').first().textContent();
  assert.doesNotMatch(standing,/Trust 68\/100 · Morale 60\/100/,'payment and training loyalty effects persist with the character');
  await page.locator('#companyClose').click();
  await page.locator('#camp').click();
  await page.locator('#speed').click();
  await page.locator('#speed').click();
  assert.match(await page.locator('#speed').textContent(),/4×/,'travel speed can be raised for the browser route');
  await page.locator('.settlement[aria-label="Oakrest"]').click();
  await page.locator('#travel').click();
  assert.equal(await page.locator('#camp').isDisabled(),true,'camp is disabled immediately when settlement travel starts');
  assert.equal(await page.locator('#cancel').isDisabled(),false,'the active journey can be cancelled');
  await page.locator('#cancel').click();
  assert.equal(await page.locator('#camp').isDisabled(),false,'cancelling travel restores camp controls');
  await page.locator('.settlement[aria-label="Oakrest"]').click();
  await page.locator('#travel').click();
  await page.waitForFunction(()=>document.querySelector('#travelTitle').textContent.includes('arrived at Oakrest'),null,{timeout:15000});
  assert.equal(await page.locator('#camp').isDisabled(),false,'arrival restores camp controls');
  await page.locator('#center').click();
  await page.locator('#roamMode').click();
  await page.locator('.roaming-party[aria-label="Redvale Raiders"] circle').click();
  await page.waitForFunction(()=>document.querySelector('#travelSub').textContent.includes('Off-road travel'),null,{timeout:5000});
  assert.equal(await page.locator('#camp').isDisabled(),true,'camp is disabled during off-road travel');
  assert.equal(await page.locator('#payCompanions').isDisabled(),true,'daily payment is disabled during travel');
  await page.locator('#battleOverlay').waitFor({state:'visible',timeout:20000});
  assert.match(await page.locator('#battleTitle').textContent(),/Redvale Raiders/,'reaching the hostile map party opens its campaign battle');
  assert.equal(await page.locator('#payCompanions').isDisabled(),true,'daily payment is disabled during battle');
  assert.equal(await page.locator('#trainCompanions').isDisabled(),true,'camp training is disabled during battle');
  await page.locator('#battlePause').click();
  assert.equal(await page.locator('#battlePause').getAttribute('aria-pressed'),'true','battle pause is exposed accessibly');
  assert.equal(await page.locator('#battleAttack').isDisabled(),true,'combat input is disabled while paused');
  assert.equal(await page.locator('#battleRetreat').isDisabled(),false,'retreat remains available while paused');
  const checkpoint=await page.evaluate(()=>JSON.parse(localStorage.getItem('ironCrownSave')));
  assert.ok(checkpoint.state.activeBattle&&checkpoint.state.activeBattle.pending,'pausing persists an active campaign battle checkpoint');
  await page.reload({waitUntil:'load'});
  await page.locator('#battleOverlay').waitFor({state:'visible',timeout:10000});
  assert.match(await page.locator('#battleTitle').textContent(),/Redvale Raiders/,'the same hostile encounter resumes after browser reload');
  assert.equal(await page.locator('#battlePause').getAttribute('aria-pressed'),'false','a restored battle opens in its active state');
  await page.locator('#battlePause').click();
  assert.equal(await page.locator('#battlePause').getAttribute('aria-pressed'),'true');
  await page.locator('#battlePause').click();
  await page.locator('[data-battle-order="hold"]').click();
  assert.equal(await page.locator('#battleOrder').textContent(),'Hold','the restored battle accepts a player order');
  await page.locator('#battlePause').click();
  await page.locator('#battleRetreat').click();
  await page.locator('#battleResult').waitFor({state:'visible'});
  assert.equal(await page.locator('#battleResultTitle').textContent(),'Retreat','retreat resolves through the campaign battle result path');
  await page.locator('#battleContinue').click();
  await page.locator('#battleOverlay').waitFor({state:'hidden'});
  const battleSaved=await page.evaluate(()=>JSON.parse(localStorage.getItem('ironCrownSave')));
  assert.equal(battleSaved.state.activeBattle,null,'resolved battle checkpoint is cleared');
  assert.equal(battleSaved.state.resolvedBattleIds.length,1,'retreat result is recorded exactly once');
  assert.ok(!battleSaved.state.defeatedParties.includes('red-bandits'),'retreat does not mark the hostile party defeated');
  assert.equal(await page.locator('.roaming-party[aria-label="Redvale Raiders"]').count(),1,'the retreated enemy remains on the campaign map');

  const recoverySave=JSON.parse(JSON.stringify(saved));
  recoverySave.state.camped=true;
  recoverySave.state.activePartyIds=[];
  recoverySave.state.activeBattle=null;
  recoverySave.state.characterRoster.characters[0].status='recovering';
  const recoveryContext=await browser.newContext({viewport:{width:900,height:760},serviceWorkers:'block'});
  const recoveryPage=await recoveryContext.newPage(),recoveryErrors=[];
  recoveryPage.setDefaultTimeout(10000);
  recoveryPage.on('pageerror',error=>recoveryErrors.push(error.message));
  await recoveryPage.addInitScript(value=>localStorage.setItem('ironCrownSave',value),JSON.stringify(recoverySave));
  await recoveryPage.goto(url,{waitUntil:'load'});
  await recoveryPage.locator('#rest').waitFor({state:'visible'});
  await recoveryPage.locator('#rest').click();
  assert.equal(await recoveryPage.locator('#clock').textContent(),'DAY 1 · 11:00','two-hour camp rest advances campaign time');
  await recoveryPage.locator('#companyButton').click();
  assert.match(await recoveryPage.locator('#availablePartyList').textContent(),/Mara Venn/,'a recovered companion returns to the available roster');
  await recoveryPage.locator('#availablePartyList button').filter({hasText:'Add to party'}).first().click();
  assert.equal(await recoveryPage.locator('#activePartyCount').textContent(),'1/4','a recovered companion can be reassigned');
  const recoveryResult=await recoveryPage.evaluate(()=>JSON.parse(localStorage.getItem('ironCrownSave')));
  assert.equal(recoveryResult.state.characterRoster.characters[0].status,'available','camp recovery persists the available status');
  assert.deepEqual(recoveryErrors,[],'camp recovery browser session has no uncaught page errors');
  await recoveryContext.close();

  const casualtyContext=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const casualtyPage=await casualtyContext.newPage(),casualtyErrors=[];
  casualtyPage.setDefaultTimeout(10000);casualtyPage.on('pageerror',error=>casualtyErrors.push(error.message));
  await casualtyPage.goto(url,{waitUntil:'load'});
  const casualty=await casualtyPage.evaluate(()=>{
   const state=window.IronCrownState.createInitialState();
   state.current='kingsbridge';state.troops=0;state.health=100;state.camped=false;
   const roster=window.IronCrownCharacters.create({campaignId:'browser-live-casualty'});
   const mara=roster.add({name:'Mara Venn',role:'companion',motivation:'glory',trust:50,morale:0});
   state.characterRoster=roster;
   const party=window.IronCrownParty.create({roster,getActiveIds:()=>state.activePartyIds,setActiveIds:ids=>{state.activePartyIds=ids},maxSize:4});
   const assigned=party.assign(mara.id);
   if(!assigned.ok)throw new Error('Could not assign the seeded companion: '+assigned.reason);
   const saveSystem=window.IronCrownSave.create({
    getState:()=>state,
    getPlace:id=>window.IronCrownWorld.places.find(place=>place.id===id)||null,
    getDiscoveryIds:()=>window.IronCrownWorld.discoveries.map(item=>item.id),
    getItemIds:slot=>Object.keys(window.IronCrownItems).filter(id=>!slot||window.IronCrownItems[id].slot===slot),
    getCharacterRoster:()=>roster.snapshot(),
    setCharacterRoster:snapshot=>{state.characterRoster=window.IronCrownCharacters.restore(snapshot)},
    createCharacterRoster:()=>window.IronCrownCharacters.create(),
    resourceApi:window.IronCrownCampaignResources,
    getResourceSites:()=>window.IronCrownWorld.resourceSites,
    notify:()=>{},
    version:window.IronCrownState.saveVersion
   });
   let saves=0,campaign;
   campaign=window.IronCrownCampaignBattle.create({
    simulation:window.IronCrownBattleSimulation.create(),roster,party,getState:()=>state,
    save:()=>{
     state.activeBattle=campaign.active()?campaign.serialize():null;
     if(!saveSystem.save())throw new Error('The browser could not persist the campaign battle checkpoint/result');
     saves++;
    }
   });
   const started=campaign.start({id:'red-bandits',name:'Redvale Raiders',power:8},{id:'campaign-hero',name:'Commander',hp:100,maxHp:100,attack:1,defence:0,speed:400});
   if(!started.ok)throw new Error('The deterministic browser battle did not start: '+started.reason);
   campaign.setPlayerInput({moveX:1,moveY:1,facingX:1,facingY:1});
   let steps=0;
   while(campaign.active()&&steps<1000){campaign.step(.05);steps++;}
   if(campaign.active())throw new Error('The browser battle did not reach a terminal result');
   const result=campaign.getResult();
   const duplicate=campaign.applyResult(result);
   return {
    characterId:mara.id,steps,result,duplicate,saves,
    save:JSON.parse(localStorage.getItem('ironCrownSave')||'null')
   };
  });
  assert.ok(casualty.steps<1000,'the real-browser battle simulation reaches a terminal result');
  assert.equal(casualty.result.outcome,'defeat');
  assert.equal(casualty.result.reason,'warband-routed');
  assert.deepEqual(casualty.result.characterOutcomes,[{characterId:casualty.characterId,alive:false,hp:0,maxHp:46}],'the simulation reports the exact named companion casualty');
  assert.equal(casualty.duplicate.duplicate,true,'replaying the same result is rejected as a duplicate');
  assert.equal(casualty.saves,2,'battle start and result each save once; duplicate replay does not save again');
  assert.equal(casualty.save.version,12);
  assert.equal(casualty.save.state.characterRoster.characters[0].status,'recovering','the casualty is persisted as recovering');
  assert.deepEqual(casualty.save.state.activePartyIds,[],'the casualty is removed from the persisted active party');
  assert.equal(casualty.save.state.resolvedBattleIds.length,1,'the battle result is persisted exactly once');
  assert.equal(casualty.save.state.activeBattle,null,'the completed battle checkpoint is cleared');
  await casualtyPage.reload({waitUntil:'load'});
  assert.equal(await casualtyPage.locator('#clock').textContent(),'DAY 1 · 08:00','the casualty save reloads into the real campaign UI');
  await casualtyPage.locator('#camp').click();
  await casualtyPage.locator('#rest').click();
  assert.equal(await casualtyPage.locator('#clock').textContent(),'DAY 1 · 10:00','two-hour camp recovery advances campaign time');
  await casualtyPage.locator('#companyButton').click();
  assert.match(await casualtyPage.locator('#availablePartyList').textContent(),/Mara Venn/,'the recovered companion returns to the available roster');
  await casualtyPage.locator('#availablePartyList button').filter({hasText:'Add to party'}).first().click();
  assert.equal(await casualtyPage.locator('#activePartyCount').textContent(),'1/4','the recovered companion can be reassigned through the campaign UI');
  const casualtyAfterRecovery=await casualtyPage.evaluate(()=>JSON.parse(localStorage.getItem('ironCrownSave')));
  assert.equal(casualtyAfterRecovery.state.characterRoster.characters[0].status,'available');
  assert.deepEqual(casualtyAfterRecovery.state.activePartyIds,[casualty.characterId]);
  assert.equal(casualtyAfterRecovery.state.resolvedBattleIds.length,1,'the result ledger survives reload and recovery');
  assert.deepEqual(casualtyErrors,[],'live battle casualty and recovery browser session has no uncaught page errors');
  await casualtyContext.close();

  const resourceContext=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const resourcePage=await resourceContext.newPage(),resourceErrors=[];
  resourcePage.setDefaultTimeout(10000);resourcePage.on('pageerror',error=>resourceErrors.push(error.message));
  const resourceSeed={version:11,state:{current:'kingsbridge',freePosition:null,gold:85,troops:12,health:100,day:1,minutes:480,camped:false,supplies:5,lastCompanionPayDay:0,inventory:['worn-blade','travel-cloak'],equipment:{weapon:'worn-blade',armour:'travel-cloak',offhand:null},discoveries:[],defeatedParties:[],metCaravans:[],houseStanding:{alder:0,veyne:0,rowan:0},audiences:[],activePartyIds:[],activeBattle:null,resolvedBattleIds:[],resolvedCampaignEventIds:[],characterRoster:{version:2,campaignId:'resource-browser',nextCharacterSequence:1,nextEventSequence:1,characters:[]}}};
  await resourcePage.addInitScript(value=>{if(!sessionStorage.getItem('resourceBrowserSeeded')){localStorage.setItem('ironCrownSave',value);sessionStorage.setItem('resourceBrowserSeeded','1')}},JSON.stringify(resourceSeed));
  await resourcePage.goto(url,{waitUntil:'load'});
  const fishMarker=resourcePage.locator('.resource-site[aria-label="Kingsbridge Fishery resource site"]');
  await fishMarker.waitFor();await fishMarker.locator('circle').click();
  assert.equal(await resourcePage.locator('#resourcePanelStock').textContent(),'12 / 12');
  assert.equal(await resourcePage.locator('#resourceGather').isDisabled(),true);
  assert.equal(await resourcePage.locator('#resourceTravel').isDisabled(),false);
  await resourcePage.locator('#speed').click();await resourcePage.locator('#speed').click();
  await resourcePage.locator('#resourceTravel').click();
  await resourcePage.waitForFunction(()=>{const s=JSON.parse(localStorage.getItem('ironCrownSave')||'null');const p=s&&s.state&&s.state.freePosition;return !!p&&Math.abs(p.x-700)<0.01&&Math.abs(p.y-300)<0.01;},null,{timeout:20000});
  await fishMarker.focus();
  await resourcePage.keyboard.press('Enter');
  assert.equal(await resourcePage.locator('#resourceGather').isDisabled(),false);
  assert.equal(await resourcePage.locator('#resourcePanelDistance').textContent(),'0 map units');
  const before=await resourcePage.evaluate(()=>JSON.parse(localStorage.getItem('ironCrownSave')).state);
  await resourcePage.locator('#resourceGather').click();
  const after=await resourcePage.evaluate(()=>JSON.parse(localStorage.getItem('ironCrownSave')));
  assert.equal(after.version,12);assert.equal(after.state.resourceStock['kingsbridge-fish'],9);assert.equal(after.state.rawMaterials.fish,3);
  assert.ok(Math.abs((after.state.day*1440+after.state.minutes)-(before.day*1440+before.minutes)-60)<0.001);
  await resourcePage.reload({waitUntil:'load'});
  await fishMarker.focus();
  await resourcePage.keyboard.press('Enter');
  assert.equal(await resourcePage.locator('#resourcePanelStock').textContent(),'9 / 12');
  assert.equal(await resourcePage.locator('#resourcePanelOwned').textContent(),'3 / 99');
  assert.deepEqual(resourceErrors,[]);
  await resourceContext.close();

  const offlineContext=await browser.newContext({viewport:{width:900,height:760},serviceWorkers:'allow'});
  const offlinePage=await offlineContext.newPage(),offlineErrors=[];
  offlinePage.setDefaultTimeout(15000);
  offlinePage.on('pageerror',error=>offlineErrors.push(error.message));
  await offlinePage.goto(url,{waitUntil:'load'});
  await offlinePage.evaluate(async()=>{await navigator.serviceWorker.ready;});
  await offlinePage.reload({waitUntil:'load'});
  await offlinePage.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:15000});
  const controlled=await offlinePage.evaluate(()=>({
   active:!!navigator.serviceWorker.controller,
   scriptURL:navigator.serviceWorker.controller&&navigator.serviceWorker.controller.scriptURL
  }));
  assert.equal(controlled.active,true,'the active service worker controls the online campaign page');
  assert.ok(controlled.scriptURL.endsWith('/sw.js'),'the expected campaign service worker controls the page');
  await offlineContext.setOffline(true);
  await offlinePage.reload({waitUntil:'load'});
  await offlinePage.locator('.settlement[aria-label="Kingsbridge"]').waitFor();
  assert.equal(await offlinePage.locator('#clock').textContent(),'DAY 1 · 08:00','the cached campaign shell opens without network access');
  assert.equal(await offlinePage.evaluate(()=>!!navigator.serviceWorker.controller),true,'the cached page remains service-worker controlled offline');
  assert.deepEqual(offlineErrors,[],'offline launch has no uncaught page errors');
  await offlineContext.close();

  assert.deepEqual(errors,[],'the complete travel and battle browser session has no uncaught page errors');
  await context.close();
  console.log('Iron Crown Chromium smoke test passed: recruitment, party, pay, training, travel, battle checkpoint/reload, retreat, recovery, resource gathering and persistence.');
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
}
run().catch(error=>{console.error(error);process.exitCode=1});
