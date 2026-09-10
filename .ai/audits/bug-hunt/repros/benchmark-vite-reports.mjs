import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { gzipSync,brotliCompressSync } from 'node:zlib'
assert(process.cwd().includes('master-css-bh-isolated-'))
const suite=process.argv[2]
assert(['build-diagnostics','startup-diagnostics'].includes(suite))
const command=spawnSync('pnpm',['exec','vitest','bench',suite,'--run'],{
  env:{...process.env,BENCHMARK_ROUNDS:'1'},stdio:'inherit',timeout:900000
})
assert.equal(command.status,0,command.error?.message||'Original startup report failed')
const report=JSON.parse(await readFile(`.results/${suite}/report.json`,'utf8'))
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
  if(suite==='startup-diagnostics'&&variant.id.includes('master-cli')) {
    for(const id of ['cli-command-elapsed-ms','cli-core-module-import-ms','cli-entry-import-ms','cli-run-program-ms'])assert(values[id]>0,`${variant.id}/${id}`)
  }
  const isVite=variant.id.includes('master-vite')
  assert.equal(values['source-file-count'],isVite?2:1)
  let sources
  if(isVite) {
    for(const id of ['vite-master-module-scan-ms','vite-master-style-entry-ms','vite-master-generate-bundle-ms'])assert(values[id]>0,`${variant.id}/${id}`)
    const artifact=report.artifacts.find(item=>item.path.includes(`/workspaces/${variant.id}/`)&&item.path.endsWith('/scanned-sources.json'))
    assert(artifact,`${variant.id}/missing source artifact`)
    sources=JSON.parse(await readFile(resolve('..',artifact.path),'utf8'))
    assert.deepEqual(sources,['index.html','src/main.js'])
  }
  console.log(JSON.stringify({suite,sources,variant:variant.id,metrics:Object.keys(values),cssBytes:css.length,cssHash:createHash('sha256').update(css).digest('hex'),sampleCount:samples.length,pass:true}))
}
assert.deepEqual(report.metrics.filter(metric=>!report.samples.some(sample=>sample.metricId===metric.id)).map(metric=>metric.id),[])
console.log(JSON.stringify({suite:report.suite,variants:report.variants.length,samples:report.samples.length,summary:report.summary.length,
  missingMetricIds:report.metrics.filter(metric=>!report.samples.some(sample=>sample.metricId===metric.id)).map(metric=>metric.id),pass:true}))
