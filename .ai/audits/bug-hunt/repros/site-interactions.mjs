import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const site=resolve(process.argv[2]);const repo=fileURLToPath(new URL('../../../../',import.meta.url))
const require=createRequire(resolve(repo,'package.json'));const playwright=require('@playwright/test');const {expect}=playwright
const browserName=process.env.BH_BROWSER||'chromium';assert.ok(['chromium','firefox','webkit'].includes(browserName))
const evidencePrefix=process.env.BH_EVIDENCE_PREFIX||'0051'
const probe=createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r))
const child=spawn(process.execPath,[resolve(site,'tests/dogfood/serve-static.mjs')],{env:{...process.env,MASTER_CSS_DOGFOOD_PORT:String(port)},stdio:'ignore'})
const browser=await playwright[browserName].launch();const records=[{browser:browserName,version:browser.version()}]
try {
 const url=`http://127.0.0.1:${port}`
 for(let i=0;i<50;i++){try{if((await fetch(url+'/en/reference')).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 if (!process.argv.includes('--colors-only')) {
 for(const width of [390,768,1280]) {
  const page=await browser.newPage({viewport:{width,height:900}})
  try {
   await page.goto(url+'/en/reference');await expect(page.locator('h1').first()).toBeVisible()
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
   const trigger=page.locator('a[href*="/guide"]:visible').first();await trigger.focus()
   await page.keyboard.press('Control+k');const input=page.getByRole('searchbox',{name:'Search documentation',exact:true});await expect(input).toBeVisible()
   await input.fill('padding');await expect(page.locator('#documentation-result-0')).toBeVisible()
   await input.press('ArrowDown');assert.ok(await input.getAttribute('aria-activedescendant'))
   await input.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(trigger).toBeFocused()
   await page.keyboard.press('Control+k');await expect(input).toHaveValue('padding')
   await input.fill('zzzz-audit-no-match');await expect(page.getByText('No matching documents',{exact:true})).toBeVisible()
   await input.fill('padding');const first=page.locator('#documentation-result-0');await expect(first).toBeVisible();const href=await first.getAttribute('href');await first.click();await expect(page).toHaveURL(new URL(href,url).href)
   records.push({width,search:'PASS',layout:'PASS',navigation:href})
  }catch(error){records.push({width,error:error.message})}finally{await page.close()}
 }
 const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message))
 try {
  await page.goto(url+'/en/play');const frame=page.frameLocator('iframe.demo');await expect(frame.getByText('Rendering with your custom CSS.',{exact:true})).toBeVisible({timeout:30000})
  await expect(frame.locator('.btn')).toHaveCSS('display','inline-flex')
  await expect(page.locator('.monaco-editor').first()).toBeVisible({timeout:30000})
  const editor=page.locator('.monaco-editor textarea').first();await editor.waitFor({state:'attached',timeout:30000})
  await page.waitForFunction(()=>window.monaco?.editor.getModels().some(model=>model.getLanguageId()==='html'))
  await page.evaluate(source => window.monaco.editor.getModels().find(model => model.getLanguageId() === 'html').setValue(source), '<h1 class="fg:#ff0000">Audit preview</h1>')
  await expect(frame.getByRole('heading',{name:'Audit preview'})).toHaveCSS('color','rgb(255, 0, 0)',{timeout:10000})
  await page.evaluate(source => window.monaco.editor.getModels().find(model => model.getLanguageId() === 'html').setValue(source), '<h1 class="fg:#0000ff">Audit preview</h1>');await expect(frame.getByRole('heading',{name:'Audit preview'})).toHaveCSS('color','rgb(0, 0, 255)',{timeout:10000})
  assert.deepEqual(errors,[]);records.push({play:'PASS',checks:'starter CSS + editor changes recompile red→blue'})
 }catch(error){records.push({play:'FAIL',error:error.message,pageErrors:errors})}finally{await page.close()}
 }
 if (process.env.BH_SYNTAX_MIGRATION) {
  for (const width of [390,768,1280]) {
   const page=await browser.newPage({viewport:{width,height:900}})
   try {
    await page.goto(url+'/en/guide/syntax-tutorial')
    await expect(page.locator('h1').first()).toBeVisible()
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
    const button=page.frameLocator('iframe[title="Responsive syntax tutorial button preview"]').getByRole('button',{name:'Save',exact:true})
    const below=await button.evaluate(el=>parseFloat(getComputedStyle(el).paddingTop))
    await page.getByRole('button',{name:'At sm and above',exact:true}).click()
    await expect.poll(()=>button.evaluate(el=>parseFloat(getComputedStyle(el).paddingTop))).toBeGreaterThan(below)
    const above=await button.evaluate(el=>parseFloat(getComputedStyle(el).paddingTop))
    await page.getByRole('button',{name:'Below sm',exact:true}).click()
    await expect.poll(()=>button.evaluate(el=>parseFloat(getComputedStyle(el).paddingTop))).toBe(below)
    await page.locator('[aria-label="Preview viewport"]').scrollIntoViewIfNeeded()
    await page.screenshot({path:repo+'.ai/audits/bug-hunt/evidence/'+evidencePrefix+'-tutorial-'+width+'.png'})
    records.push({tutorial:'PASS',width,below,above,reset:below})
   }catch(error){records.push({tutorial:'FAIL',width,error:error.message})}finally{await page.close()}
  }
  const mappings=JSON.parse(readFileSync(resolve(site,'utils/legacy-syntax.json'),'utf8'))
  const page=await browser.newPage()
  try {
   for(const locale of ['en','tw']) for(const [slug,mapping] of Object.entries(mappings)) {
    const [anchor,destination]=Object.entries(mapping.anchors)[0]
    await page.goto(url+'/'+locale+'/guide/'+slug+'#'+anchor)
    await expect(page).toHaveURL(url+'/'+locale+destination)
    records.push({legacyRedirect:'PASS',locale,slug,destination})
   }
  }catch(error){records.push({legacyRedirect:'FAIL',error:error.message})}finally{await page.close()}
 }
 const colorPage=await browser.newPage()
 try {
  await colorPage.goto(url+'/en/guide/introduction');await colorPage.locator('[class~="surface:raised"]').first().waitFor()
  for(const mode of ['light','dark']) {
   const state=await colorPage.evaluate(async mode=>{
    document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(mode)
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))
    const element=document.querySelector('[class~="surface:raised"]');const probe=document.createElement('div');probe.style.backgroundColor=mode==='light'?'oklch(100% 0 none)':'var(--color-gray-90)';document.body.append(probe)
    const actual=getComputedStyle(element).backgroundColor;const expected=getComputedStyle(probe).backgroundColor;probe.remove()
    const canvas=document.createElement('canvas');canvas.width=1;canvas.height=1;const ctx=canvas.getContext('2d');const rgba=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data]}
    return {actual,expected,actualRGBA:rgba(actual),expectedRGBA:rgba(expected),white:getComputedStyle(document.documentElement).getPropertyValue('--color-white')}
   },mode)
   assert.deepEqual(state.actualRGBA,state.expectedRGBA);assert.equal(state.white,'');records.push({mode,color:'PASS',...state})
  }
 }catch(error){records.push({color:'FAIL',error:error.message})}finally{await colorPage.close()}
 console.log(JSON.stringify(records,null,2));process.exitCode=records.some(r=>r.error)?1:0
}finally{await browser.close();if(child.exitCode===null){const ended=once(child,'exit');child.kill('SIGTERM');await ended}}
