import assert from 'node:assert/strict'
import { readFile, writeFile, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
await import('./benchmark-runtime-array-report.mjs')
const suite=process.argv[2]
const report=JSON.parse(await readFile(`.results/${suite}/report.json`,'utf8'))
const copy=resolve(`shared/.bug-hunt-style-validity.ts`)
const name=suite==='runtime-style-invalidation-diagnostics'?'assertRuntimeStyleInvalidationResult':'assertRuntimeMutationDiagnosticResult'
await writeFile(copy,await readFile(`shared/${suite}.ts`,'utf8')+`\nexport { ${name} as auditAssert }\n`)
try {
  const { auditAssert }=await import(pathToFileURL(copy))
  for (const artifact of report.artifacts.filter(({path})=>path.endsWith('/diagnostics.json'))) {
    const result=JSON.parse(await readFile(resolve('..',artifact.path),'utf8'))
    const id=result.variant?.id||artifact.path.split('/artifacts/')[1].split('/')[0]
    const page=report.artifacts.find(({path})=>path.endsWith(`/pages/${id}/index.html`))
    const config=JSON.parse((await readFile(resolve('..',page.path),'utf8')).match(/window\.__interactionConfig = (\{[^\n]+\});/)[1])
    const gate=value=>result.variant?auditAssert(result.variant,value):auditAssert(id,config.modeId,result.traceWindowId,value)
    if (result.variant) assert.deepEqual(result.temporaryClassNames,config.classes.temp)
    if (result.interaction.details.action!=='idle-window') {
      const checks=result.interaction.details.styleChecks
      assert.equal(checks.length,config.cleanupCycles)
      assert(checks.every(check=>check.valid&&check.textAlign==='center'&&Math.abs(check.width-check.expectedWidth)<0.01))
    }
    gate(result)
    const invalidStyle=structuredClone(result);invalidStyle.interaction.computedStyleValid=0
    assert.throws(()=>gate(invalidStyle),/failed computed-style validation/)
    for (const temporary of config.classes.temp) {
      const retained=structuredClone(result);retained.afterForcedCleanupState.retainedClassNames.push(temporary)
      assert.throws(()=>gate(retained),/left retained temporary classes/)
    }
    assert.deepEqual(report.samples.filter(sample=>sample.variantId===id&&sample.metricId==='computed-style-valid').map(sample=>sample.value),[result.interaction.computedStyleValid])
    assert.equal(report.summary.find(item=>item.variantId===id&&item.metricId==='computed-style-valid').median,result.interaction.computedStyleValid)
    console.log(JSON.stringify({styleReport:suite,variantId:id,temporary:config.classes.temp,styleChecks:result.interaction.details.styleChecks,
      positiveGate:true,invalidStyleRejected:true,retainedClassRejections:config.classes.temp.length,pass:true}))
  }
} finally {await rm(copy)}
