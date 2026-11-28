'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const ROOT=__dirname;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
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
async function clickRoute(page,route){
 for(const direction of route)await page.locator('[data-move="'+direction+'"]').click();
}
async function run(){
 const server=createServer();
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 const address=server.address();
 const url='http://127.0.0.1:'+address.port+'/';
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:900,height:900}});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(url,{waitUntil:'load'});
  await page.locator('.cell').first().waitFor();
  assert.equal(await page.locator('.cell').count(),25,'the browser renders the complete 5×5 board');
  assert.equal(await page.locator('#lightValue').textContent(),'12 / 12');
  assert.equal(await page.locator('#moveCount').textContent(),'Moves: 0');
  assert.equal(await page.locator('#levelName').textContent(),'Broken Nave','the current ruin name is visible');

  const board=page.locator('#grid');
  assert.equal(await board.getAttribute('tabindex'),'0','the board can receive keyboard focus');
  assert.match(await board.getAttribute('aria-keyshortcuts'),/ArrowUp/,'the board advertises its movement shortcuts');
  await board.focus();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'grid','keyboard focus can be placed directly on the board');
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.locator('#moveCount').textContent(),'Moves: 0','blocked keyboard movement does not consume a turn');
  assert.match(await page.locator('#status').textContent(),/blocks that way/);
  await page.keyboard.press('ArrowUp');
  assert.equal(await page.locator('#moveCount').textContent(),'Moves: 1','keyboard movement updates the live board');
  await page.locator('#restart').click();

  await page.locator('#hint').click();
  assert.equal(await page.locator('#hintCount').textContent(),'Hints: 1');
  assert.equal(await page.locator('#lightValue').textContent(),'12 / 12','a hint does not consume lantern light');
  assert.match(await page.locator('#status').textContent(),/reduces your final score/);
  await page.locator('#restart').click();

  const routes=[
   ['up','up','right','right','right','up','up','right'],
   ['up','right','up','right','up','up','right','right'],
   ['up','right','right','right','up','up','right','up'],
   ['up','right','up','right','up','right','up','right']
  ];
  await clickRoute(page,routes[0]);
  assert.match(await page.locator('#status').textContent(),/New personal best saved: 720/);
  assert.equal(await page.locator('#bestScore').textContent(),'Best: 720');
  await page.locator('#restart').click();
  assert.match(await page.locator('#status').textContent(),/^Ruin 2/);
  assert.equal(await page.locator('#levelName').textContent(),'Flooded Archive');

  await page.locator('[data-move="right"]').click();
  await page.locator('[data-move="right"]').click();
  assert.match(await page.locator('#status').textContent(),/Run ended/,'the second ruin trap ends the run');
  assert.equal(await page.locator('#restart').textContent(),'Try again');
  await page.locator('#restart').click();
  assert.match(await page.locator('#status').textContent(),/^Ruin 2 · Lantern light: 12/,'retry keeps the same ruin');
  assert.equal(await page.locator('#levelName').textContent(),'Flooded Archive','retry keeps the same ruin name');
  await clickRoute(page,routes[1]);
  assert.match(await page.locator('#status').textContent(),/New personal best saved: 720/);

  await page.locator('#restart').click();
  assert.match(await page.locator('#status').textContent(),/^Ruin 3/);
  assert.equal(await page.locator('#levelName').textContent(),'Ashen Gallery');
  await clickRoute(page,routes[2]);
  assert.match(await page.locator('#status').textContent(),/New personal best saved: 720/);
  await page.locator('#restart').click();
  assert.match(await page.locator('#status').textContent(),/^Ruin 4 · Lantern light: 12/,'the third escape unlocks the fourth ruin');
  assert.equal(await page.locator('#levelName').textContent(),'Gilded Observatory');
  await clickRoute(page,routes[3]);
  assert.match(await page.locator('#status').textContent(),/New personal best saved: 720/);
  await page.locator('#restart').click();
  assert.match(await page.locator('#status').textContent(),/^Ruin 1 · Lantern light: 12/,'the fourth escape cycles back to the first ruin');
  assert.equal(await page.locator('#levelName').textContent(),'Broken Nave','the first ruin name returns after the final escape');

  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('lanternRunRecordsV1')));
  assert.deepEqual(stored.bestScores,[720,720,720,720],'all four best scores persist in browser storage');
  await page.reload({waitUntil:'load'});
  assert.equal(await page.locator('#bestScore').textContent(),'Best: 720','personal records survive a real browser reload');
  await page.setViewportSize({width:320,height:720});
  const mobile=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,mainWidth:document.querySelector('main').getBoundingClientRect().width}));
  assert.ok(mobile.mainWidth<=mobile.width,'the game panel fits a narrow mobile viewport');
  assert.ok(mobile.scrollWidth<=mobile.width,'the page has no horizontal overflow at 320px');
  assert.deepEqual(errors,[],'the normal browser session has no uncaught page errors');

  const blockedContext=await browser.newContext({viewport:{width:360,height:760}});
  const blockedPage=await blockedContext.newPage();
  const blockedErrors=[];
  blockedPage.on('pageerror',error=>blockedErrors.push(error.message));
  await blockedPage.addInitScript(()=>Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new Error('storage blocked')}}));
  await blockedPage.goto(url,{waitUntil:'load'});
  await blockedPage.locator('.cell').first().waitFor();
  await clickRoute(blockedPage,routes[0]);
  assert.match(await blockedPage.locator('#status').textContent(),/New session best: 720/,'blocked browser storage falls back to a session-only best score');
  assert.equal(await blockedPage.locator('#bestScore').textContent(),'Best: 720');
  assert.deepEqual(blockedErrors,[],'blocked storage does not cause uncaught browser errors');
  await blockedContext.close();

  const touchContext=await browser.newContext({viewport:{width:320,height:720},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const touchPage=await touchContext.newPage();
  const touchErrors=[];
  touchPage.on('pageerror',error=>touchErrors.push(error.message));
  await touchPage.goto(url,{waitUntil:'load'});
  await touchPage.locator('.cell').first().waitFor();
  assert.ok(await touchPage.evaluate(()=>navigator.maxTouchPoints>0),'the browser context exposes touch input');
  await touchPage.locator('.cell[data-x="4"][data-y="4"]').tap();
  assert.equal(await touchPage.locator('#moveCount').textContent(),'Moves: 0','tapping a non-adjacent tile does not consume a move');
  assert.match(await touchPage.locator('#status').textContent(),/Tap an adjacent tile/);
  await touchPage.locator('.cell[data-x="0"][data-y="3"]').tap();
  assert.equal(await touchPage.locator('#moveCount').textContent(),'Moves: 1','tapping an adjacent tile moves the player');
  assert.equal(await touchPage.locator('#lightValue').textContent(),'11 / 12');
  await touchPage.locator('#restart').tap();
  assert.equal(await touchPage.locator('#moveCount').textContent(),'Moves: 0','restart resets a tap-driven move');
  await touchPage.locator('[data-move="up"]').tap();
  assert.equal(await touchPage.locator('#moveCount').textContent(),'Moves: 1','a touch tap moves the player');
  await touchPage.locator('#hint').tap();
  assert.equal(await touchPage.locator('#hintCount').textContent(),'Hints: 1','the hint control responds to touch');
  assert.match(await touchPage.locator('#status').textContent(),/reduces your final score/);
  const touchMetrics=await touchPage.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,mainWidth:document.querySelector('main').getBoundingClientRect().width}));
  assert.ok(touchMetrics.mainWidth<=touchMetrics.width,'the game panel fits a touch-sized viewport');
  assert.ok(touchMetrics.scrollWidth<=touchMetrics.width,'touch-sized layout has no horizontal overflow');
  await touchPage.locator('#restart').tap();
  assert.equal(await touchPage.locator('#moveCount').textContent(),'Moves: 0','touch restart resets the move counter');
  assert.equal(await touchPage.locator('#hintCount').textContent(),'Hints: 0','touch restart resets the hint counter');
  assert.deepEqual(touchErrors,[],'touch-emulated browser session has no uncaught page errors');
  await touchContext.close();
  await context.close();
  console.log('Lantern Run Chromium smoke tests passed: keyboard, blocked movement, hints, all ruins, trap retry, scoring, persistent records, reload, 320px layout and blocked-storage fallback.');
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
}
run().catch(error=>{console.error(error);process.exitCode=1});
