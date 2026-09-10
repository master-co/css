import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
assert(process.cwd().includes('master-css-bh-isolated-'))
const { createInteractionPage } = await import(pathToFileURL(resolve('shared/interaction-cost.ts')))
const { startBrowserLifecycleServer } = await import(pathToFileURL(resolve('shared/browser-lifecycle-server.ts')))
const { chromium, firefox, webkit } = createRequire(resolve('package.json'))('@playwright/test')
const pages = []
for (const modeId of ['master-static','tailwind-static','master-runtime','master-progressive']) {
  pages.push({modeId,...await createInteractionPage({fixtureId:'dynamic',modeId,scenarioId:'mutation-cleanup-cycle',
    variantId:`bh-0174-${modeId}`,runtimeDiagnostics:true})})
}
const failures = []
for (const [engine,launcher] of Object.entries({chromium,firefox,webkit})) {
  const browser = await launcher.launch()
  try {
    for (const generated of pages) {
      const server = await startBrowserLifecycleServer(generated.root)
      try {
        for (const control of ['normal','disabled','wrong-width','late-width']) {
          const page = await browser.newPage()
          try {
            await page.goto(server.origin); await page.waitForFunction('globalThis.__benchmarkReady === true')
            const observed = await page.evaluate(async control => {
              const probe = document.getElementById('interaction-style-probe')
              const initialAlignment = getComputedStyle(probe).textAlign
              if (control==='disabled') for (const sheet of document.styleSheets) sheet.disabled = true
              function breakWidth() {
                const style=document.createElement('style')
                style.textContent='#interaction-scratch article { width: 99px !important; }'
                document.head.append(style)
              }
              if (control==='wrong-width') breakWidth()
              const cycles = []
              const descriptor = Object.getOwnPropertyDescriptor(Node.prototype,'textContent')
              Object.defineProperty(Node.prototype,'textContent',{...descriptor,set(value) {
                if (this.id==='interaction-scratch' && this.firstElementChild) {
                  const item=this.firstElementChild,style=getComputedStyle(item)
                  cycles.push({classes:[...item.classList],width:style.width,color:style.color,boxSizing:style.boxSizing,
                    paddingLeft:style.paddingLeft,paddingRight:style.paddingRight,borderLeft:style.borderLeftWidth,borderRight:style.borderRightWidth})
                  if (control==='late-width' && cycles.length===1) breakWidth()
                }
                descriptor.set.call(this,value)
              }})
              let result
              try { result=await __runInteractionScenario() } finally { Object.defineProperty(Node.prototype,'textContent',descriptor) }
              return {initialAlignment,finalAlignment:getComputedStyle(probe).textAlign,cycles,
                temporary:__interactionConfig.classes.temp,computedStyleValid:result.computedStyleValid,cleanupValid:result.cleanupValid,
                details:result.details,scratchChildren:document.getElementById('interaction-scratch').children.length}
            },control)
            let pass=true
            try {
              assert.equal(observed.initialAlignment,'center')
              assert.equal(observed.computedStyleValid,control==='normal'?1:0)
              assert.equal(observed.cleanupValid,1)
              assert.equal(observed.scratchChildren,0)
              assert.equal(observed.cycles.length,4)
              if (control==='disabled') assert.notEqual(observed.finalAlignment,'center')
              else assert.equal(observed.finalAlignment,'center')
              if (control==='late-width') {
                assert.equal(observed.details.styleChecks[0].valid,true)
                assert.equal(observed.details.styleChecks[1].valid,false)
              }
            } catch(error) {pass=false;failures.push({engine,modeId:generated.modeId,control,error:error.message})}
            console.log(JSON.stringify({engine,modeId:generated.modeId,control,...observed,pass}))
          } finally {await page.close()}
        }
      } finally {await server.close()}
    }
  } finally {await browser.close()}
}
assert.deepEqual(failures,[])
