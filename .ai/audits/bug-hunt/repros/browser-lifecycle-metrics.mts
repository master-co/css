import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

assert(process.cwd().includes('master-css-bh-isolated-'))
const repo=fileURLToPath(new URL('../../../../',import.meta.url))
const evidence=resolve(repo,'.ai/audits/bug-hunt/evidence')
const env={...process.env,BROWSER_LIFECYCLE_SCENARIOS:'initial-load',BROWSER_LIFECYCLE_MODES:'master-runtime',BROWSER_LIFECYCLE_ROUNDS:'1',BROWSER_LIFECYCLE_WARMUP_ROUNDS:'0',BROWSER_LIFECYCLE_TRACE_ARTIFACT_MODE:'off'}
const run=spawnSync(process.execPath,['--import','tsx','browser-lifecycle/run-report.ts'],{env,stdio:'inherit',timeout:120000})
console.log(JSON.stringify({originalSuiteStatus:run.status}))
if(existsSync('.results/browser-lifecycle/report.json')) copyFileSync('.results/browser-lifecycle/report.json',resolve(evidence,'0055-browser-report.json'))
const variants=readdirSync('.results/browser-lifecycle/pages')
assert.equal(variants.length,1)
const {startBrowserLifecycleServer}=await import(pathToFileURL(resolve('shared/browser-lifecycle-server.ts')).href)
const require=createRequire(resolve(repo,'package.json'));const {chromium}=require('@playwright/test')
const pageRoot=resolve('.results/browser-lifecycle/pages',variants[0])
const server=await startBrowserLifecycleServer(pageRoot)
let browser
try {
 browser=await chromium.launch()
 const original=await browser.newPage()
 const failures=[]
 original.on('response',response=>{if(response.status()>=400) failures.push({url:response.url(),status:response.status()})})
 original.on('pageerror',error=>failures.push({pageError:error.message}))
 original.on('console',message=>{if(message.type()==='error')failures.push({console:message.text()})})
 await original.goto(server.origin)
 await original.waitForFunction(()=>globalThis.__benchmarkReady===true,undefined,{timeout:5000}).catch(()=>{})
 const baseline={failures,...await original.evaluate(()=>({ready:globalThis.__benchmarkReady===true,hasRuntime:!!globalThis.masterCSSRuntime}))}
 console.log(JSON.stringify({baseline},null,2))
 writeFileSync(resolve(evidence,'0055-missing-asset.json'),JSON.stringify(baseline,null,2)+'\n')
 await original.close()
 // The sole delivery control adds the existing local Wasm sidecar to disposable generated output.
 mkdirSync(resolve(pageRoot,'artifacts'),{recursive:true})
 copyFileSync(resolve(repo,'packages/runtime/artifacts/mastercss_binding_wasm_engine_bg.wasm'),resolve(pageRoot,'artifacts/mastercss_binding_wasm_engine_bg.wasm'))
 const page=await browser.newPage()
 await page.goto(server.origin)
 await page.waitForFunction(()=>globalThis.__benchmarkReady===true)
 const state=await page.evaluate(`(() => {
  const runtime=globalThis.masterCSSRuntime
  const snapshot=runtime.snapshot()
  const style=document.querySelector('style#master-css')
  const ruleCount=(rules)=>Array.from(rules||[]).reduce((sum,rule)=>sum+1+('cssRules' in rule?ruleCount(rule.cssRules):0),0)
  return {reported:globalThis.__readLifecycleState(),keys:Object.keys(runtime),snapshot:{rules:Object.keys(snapshot.classRules).length,bytes:new TextEncoder().encode(snapshot.cssText).length,hydration:snapshot.hydration},styleRules:ruleCount(style.sheet.cssRules),probe:getComputedStyle(document.getElementById('benchmark-style-probe')).textAlign}
 })()`)
 console.log(JSON.stringify({sidecarControl:state},null,2))
 writeFileSync(resolve(evidence,'0055-browser-control.json'),JSON.stringify(state,null,2)+'\n')
 const cssomControl=await page.evaluate(`(() => {
  const before=globalThis.__readLifecycleState().cssomRuleCount;
  const style=document.createElement('style');style.textContent='.__audit_static_control{color:red}';document.head.append(style);
  const probe=document.createElement('span');probe.className='__audit_static_control';probe.textContent='native CSS control';document.body.append(probe);
  const rule=style.sheet.cssRules[0];
  const control={before,after:globalThis.__readLifecycleState().cssomRuleCount,nativeSheetLength:style.sheet.cssRules.length,ruleType:rule.constructor.name,hasNestedRuleList:'cssRules' in rule,nestedRuleCount:rule.cssRules?.length,color:getComputedStyle(probe).color};
  probe.remove();style.remove();return control;
 })()`)
 console.log(JSON.stringify({cssomControl},null,2))
 writeFileSync(resolve(evidence,'0055-cssom-control.json'),JSON.stringify(cssomControl,null,2)+'\n')
 assert.equal(cssomControl.nativeSheetLength,1)
 assert.equal(cssomControl.color,'rgb(255, 0, 0)')
 assert(baseline.failures.some(f=>f.status===404&&f.url.endsWith('mastercss_binding_wasm_engine_bg.wasm'))&&!baseline.ready,'original fixture fails on its missing Wasm sidecar')
 assert.equal(state.probe,'center')
 assert(state.snapshot.rules>0&&state.snapshot.bytes>0&&state.styleRules>0,'public snapshot and DOM confirm active runtime CSS')
 const metricFailures=[]
 if(!(state.reported.runtimeGeneratedRuleCount>0&&state.reported.runtimeStyleRawBytes>0)) metricFailures.push('active runtime CSS reported as zero')
 if(cssomControl.after!==cssomControl.before+1) metricFailures.push('one active native CSSStyleRule does not increase CSSOM rule count')
 assert.deepEqual(metricFailures,[],'lifecycle measurements must reflect actual runtime and native CSS')
} finally {await browser?.close();await server.close()}
