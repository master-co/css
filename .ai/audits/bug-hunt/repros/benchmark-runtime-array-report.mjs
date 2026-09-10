import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
await import('./benchmark-runtime-preparation-report.mjs')
const suite = process.argv[2]
const report = JSON.parse(await readFile(`.results/${suite}/report.json`, 'utf8'))
for (const artifact of report.artifacts.filter(({path})=>path.endsWith('/diagnostics.json'))) {
  const result = JSON.parse(await readFile(resolve('..',artifact.path),'utf8'))
  const id = result.variant?.id || artifact.path.split('/artifacts/')[1].split('/')[0]
  const data = result.runtimeDiagnostics
  const values = {
    'runtime-ensure-class-rules-call-count':data.runtimeAddCallCount,
    'runtime-delete-class-rules-call-count':data.runtimeRemoveCallCount,
    'runtime-ensured-class-count':data.runtimeAddClassCount,
    'runtime-deleted-class-count':data.runtimeRemoveClassCount,
    'runtime-flush-remove-call-count':data.runtimeFlushRemoveCallCount,
    'runtime-flush-remove-class-count':data.runtimeFlushRemoveClassCount
  }
  for (const [metricId,value] of Object.entries(values)) {
    assert(Number.isInteger(value)&&value>=0,`${id}/${metricId}`)
    if (!report.metrics.some(metric=>metric.id===metricId)) continue
    assert.deepEqual(report.samples.filter(sample=>sample.variantId===id&&sample.metricId===metricId).map(sample=>sample.value),[value])
    assert.equal(report.summary.find(entry=>entry.variantId===id&&entry.metricId===metricId).median,value)
  }
  console.log(JSON.stringify({arrayReport:suite,variantId:id,values,pass:true}))
}
