import assert from 'node:assert/strict'
import { chromium,webkit } from '@playwright/test'
const browser=await ({chromium,webkit})[process.env.HOME_BROWSER??'chromium'].launch()
const url=process.env.HOME_URL??'http://127.0.0.1:3344'
const errors=[]
try{
 for(const width of [390,1280])for(const scheme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:1000},colorScheme:scheme,reducedMotion:'reduce',hasTouch:width===390})
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message))
  await page.goto(url,{waitUntil:'networkidle'})
  const lint=page.locator('.home-lint').first();await lint.scrollIntoViewIfNeeded()
  const rules=lint.locator('[role=tab]');const count=await rules.count();assert.ok(count>1)
  for(let i=0;i<count;i++){
   await rules.nth(i).click();await page.waitForTimeout(70)
   assert.equal(await rules.nth(i).getAttribute('aria-selected'),'true')
   assert.equal(await lint.locator('#home-lint-panel').getAttribute('aria-labelledby'),await rules.nth(i).getAttribute('id'))
   const phase=await lint.getAttribute('data-phase');assert.ok(['action','report'].includes(phase),phase)
   if(phase==='action'){
    await lint.locator('.home-lint-menu-item').click();await page.waitForTimeout(60)
    assert.equal(await lint.getAttribute('data-phase'),'fixed')
    await lint.locator('.home-lint-replay').click();await page.waitForTimeout(60)
    assert.equal(await lint.getAttribute('data-phase'),'action')
   }
  }
  await rules.first().click();await page.keyboard.press('ArrowDown');await page.waitForTimeout(70);assert.equal(await rules.nth(1).getAttribute('aria-selected'),'true')
  await page.keyboard.press('Home');await page.waitForTimeout(70);assert.equal(await rules.first().getAttribute('aria-selected'),'true')
  await page.emulateMedia({forcedColors:'active'})
  assert.notEqual(await lint.locator('.home-window-surface').first().evaluate(e=>getComputedStyle(e).outlineStyle),'none')
  await context.close()
 }
 const context=await browser.newContext({viewport:{width:1280,height:1000},reducedMotion:'no-preference'})
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(url,{waitUntil:'networkidle'})
 const lint=page.locator('.home-lint').first();await lint.scrollIntoViewIfNeeded();await lint.locator('[role=tab]').first().click();await page.mouse.move(1279,999);await page.evaluate(()=>document.activeElement?.blur());await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(300);await lint.evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}))
 await page.waitForFunction(()=>['report','action','apply','fixed'].includes(document.querySelector('.home-lint')?.dataset.phase),{},{timeout:10000})
 await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(200)
 const phase=await lint.getAttribute('data-phase');await page.waitForTimeout(700);assert.equal(await lint.getAttribute('data-phase'),phase)
 await lint.scrollIntoViewIfNeeded();await page.waitForTimeout(800)
 await context.close()
 assert.deepEqual(errors,[]);console.log('Lint: themes, widths, all rules, fixes, replay, keyboard, touch, forced colors and offscreen pause passed')
}finally{await browser.close()}
