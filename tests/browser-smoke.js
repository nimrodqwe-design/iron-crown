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
  assert.equal(saved.version,11);
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
  assert.deepEqual(errors,[],'the complete travel and battle browser session has no uncaught page errors');
  await context.close();
  console.log('Iron Crown Chromium smoke test passed: recruitment, party, pay, training, travel, hostile encounter, battle checkpoint/reload, Hold order, retreat, camp recovery and save persistence.');
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
}
run().catch(error=>{console.error(error);process.exitCode=1});
