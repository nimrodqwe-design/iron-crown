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
  await page.addInitScript(value=>localStorage.setItem('ironCrownSave',value),JSON.stringify(seed));
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

  await page.locator('#camp').click();
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
  assert.deepEqual(errors,[],'the real browser session has no uncaught page errors');
  await context.close();
  console.log('Iron Crown Chromium smoke test passed: save load, settlement recruitment, party assignment, daily pay, camp training, loyalty persistence and reload.');
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
}
run().catch(error=>{console.error(error);process.exitCode=1});
