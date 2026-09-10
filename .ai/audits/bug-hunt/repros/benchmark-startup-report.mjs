import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { gzipSync,brotliCompressSync } from 'node:zlib'
assert(process.cwd().includes('master-css-bh-isolated-'))
const command=spawnSync('pnpm',['exec','vitest','bench','startup-diagnostics','--run'],{
  env:{...process.env,BENCHMARK_ROUNDS:'1'},stdio:'inherit',timeout:900000
})
assert.equal(command.status,0,command.error?.message||'Original startup report failed')
const report=JSON.parse(await readFile('.results/startup-diagnostics/report.json','utf8'))
const {getStaticFixtureSource}=await import(pathToFileURL(resolve('fixtures/static.ts')))
assert.equal(report.variants.length,8)
const declared=new Set(report.metrics.map(metric=>metric.id))
assert(!declared.has('cli-bin-module-import-ms'),'Executable bin cannot be a passive import metric')
for(const variant of report.variants) {
  const samples=report.samples.filter(sample=>sample.variantId===variant.id)
  assert(samples.length>0)
  for(const sample of samples) {
    assert(declared.has(sample.metricId))
    assert(Number.isFinite(sample.value))
    const summary=report.summary.find(row=>row.variantId===variant.id&&row.metricId===sample.metricId)
    assert.equal(summary.median,sample.value)
  }
  const artifacts=report.artifacts.filter(artifact=>artifact.path.includes(`/workspaces/${variant.id}/`)&&artifact.path.endsWith('.css'))
  assert(artifacts.length>0)
  const buffers=await Promise.all(artifacts.map(artifact=>readFile(resolve('..',artifact.path))))
  const css=Buffer.concat(buffers)
  for(const marker of getStaticFixtureSource(variant.fixtureId).expectedCSSMarkers)assert(css.includes(marker),`${variant.id}/${marker}`)
  const values=Object.fromEntries(samples.map(sample=>[sample.metricId,sample.value]))
  assert.equal(values['generated-css-raw-bytes'],css.length)
  assert.equal(values['generated-css-gzip-bytes'],gzipSync(css).length)
  assert.equal(values['generated-css-brotli-bytes'],brotliCompressSync(css).length)
  if(variant.id.includes('master-cli')) {
    for(const id of ['cli-command-elapsed-ms','cli-core-module-import-ms','cli-entry-import-ms','cli-run-program-ms'])assert(values[id]>0,`${variant.id}/${id}`)
  }
  console.log(JSON.stringify({startupVariant:variant.id,metrics:Object.keys(values),cssBytes:css.length,cssHash:createHash('sha256').update(css).digest('hex'),sampleCount:samples.length,pass:true}))
}
console.log(JSON.stringify({suite:report.suite,variants:report.variants.length,samples:report.samples.length,summary:report.summary.length,
  missingMetricIds:report.metrics.filter(metric=>!report.samples.some(sample=>sample.metricId===metric.id)).map(metric=>metric.id),pass:true}))
