import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const require=createRequire(process.env.APPDATA+'/npm/node_modules/rea-agents/package.json');
const {chromium}=require('playwright-core');
const browser=await chromium.launch({headless:true,executablePath:process.env.LOCALAPPDATA+'/ms-playwright/chromium-1243/chrome-win64/chrome.exe'});
const page=await browser.newPage({viewport:{width:1640,height:1100}});
const failures=[];page.on('pageerror',e=>failures.push(e.message));
mkdirSync('artifacts',{recursive:true});
try{
 await page.goto('http://127.0.0.1:5187/',{waitUntil:'domcontentloaded',timeout:60000});
 await page.getByRole('heading',{name:/A clearer view/}).waitFor({timeout:60000});
 await page.waitForTimeout(12000);
 await page.screenshot({path:'artifacts/desktop.png',fullPage:true});
 const report={title:await page.title(),width:await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth})),buttons:await page.getByRole('button').count(),body:(await page.locator('body').innerText()).slice(0,10000),errors:failures};
 await page.getByRole('button',{name:'Cloud hive',exact:true}).click();
 await page.getByText('Keep your hive working.').waitFor();
 report.cloudSetup=await page.getByText('Your local workspace is ready.').isVisible();
 await page.getByRole('button',{name:'Bees',exact:true}).click();
 report.beeCount=await page.locator('.research-list>div').count();
 await page.getByRole('button',{name:'Positions',exact:false}).first().click();
 report.positionsEmpty=await page.getByText('No open paper positions').isVisible();
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'artifacts/mobile.png',fullPage:true});
 report.mobile=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));
 await page.getByRole('button',{name:'Toggle navigation'}).click();
 report.drawer=await page.locator('.rail').getAttribute('class');
 writeFileSync('artifacts/browser-report.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
}finally{await browser.close();}
