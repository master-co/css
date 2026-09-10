import assert from 'node:assert/strict'
import { readFile,writeFile,rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
assert(process.cwd().includes('master-css-bh-isolated-'))
const copy=resolve('shared/.bug-hunt-style-scenarios.ts')
await writeFile(copy,await readFile('shared/interaction-cost.ts','utf8')+'\nexport { measureViewportResizeInteraction }\n')
try {
  const {createInteractionPage,measureViewportResizeInteraction}=await import(pathToFileURL(copy))
  const {startBrowserLifecycleServer}=await import(pathToFileURL(resolve('shared/browser-lifecycle-server.ts')))
  const {chromium,firefox,webkit}=createRequire(resolve('package.json'))('@playwright/test')
  const pages=[]
  for(const modeId of ['master-static','tailwind-static','master-runtime','master-progressive']) for(const scenarioId of ['dom-append-remove','viewport-resize']) {
    pages.push({modeId,scenarioId,...await createInteractionPage({fixtureId:'dynamic',modeId,scenarioId,variantId:`bh-0174-${modeId}-${scenarioId}`})})
  }
  const failures=[]
  for(const [engine,launcher] of Object.entries({chromium,firefox,webkit})) {
    const browser=await launcher.launch()
    try {
      for(const generated of pages) {
        const server=await startBrowserLifecycleServer(generated.root)
        try {
          for(const control of ['normal','disabled','wrong-layout']) {
            const page=await browser.newPage({viewport:{width:1280,height:720}})
            try {
              await page.goto(server.origin);await page.waitForFunction('globalThis.__benchmarkReady === true')
              const before=await page.evaluate(({control,scenarioId})=>{
                const probe=document.getElementById('interaction-style-probe')
                const initialAlignment=getComputedStyle(probe).textAlign
                if(control==='disabled') for(const sheet of document.styleSheets)sheet.disabled=true
                if(control==='wrong-layout') {
                  const style=document.createElement('style')
                  style.textContent=scenarioId==='viewport-resize'?'.interaction-grid{grid-template-columns:1fr!important}':'#interaction-scratch article{min-height:2px!important}'
                  document.head.append(style)
                }
                return {initialAlignment,alignment:getComputedStyle(probe).textAlign}
              },{control,scenarioId:generated.scenarioId})
              const result=generated.scenarioId==='viewport-resize'?await measureViewportResizeInteraction(page):await page.evaluate(()=>__runInteractionScenario())
              const after=await page.evaluate(()=>({alignment:getComputedStyle(document.getElementById('interaction-style-probe')).textAlign,scratchChildren:document.getElementById('interaction-scratch').children.length}))
              let pass=true
              try {
                assert.equal(before.initialAlignment,'center');assert.equal(result.computedStyleValid,control==='normal'?1:0);assert.equal(after.scratchChildren,0)
                if(control==='wrong-layout')assert.equal(after.alignment,'center')
              }catch(error){pass=false;failures.push({engine,modeId:generated.modeId,scenarioId:generated.scenarioId,control,error:error.message})}
              console.log(JSON.stringify({engine,modeId:generated.modeId,scenarioId:generated.scenarioId,control,before,after,
                computedStyleValid:result.computedStyleValid,cleanupValid:result.cleanupValid,details:result.details,pass}))
            }finally{await page.close()}
          }
        }finally{await server.close()}
      }
    }finally{await browser.close()}
  }
  assert.deepEqual(failures,[])
}finally{await rm(copy)}
