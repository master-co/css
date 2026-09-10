import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {readFile,mkdir,writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {createHash} from 'node:crypto'
import {gzipSync,brotliCompressSync} from 'node:zlib'
assert(process.cwd().includes('master-css-bh-isolated-'))
const mode=process.argv[2]||'before'
assert(['before','final','consumer'].includes(mode))
const finalMode=mode!=='before'
const hash=buffer=>createHash('sha256').update(buffer).digest('hex')
const {getStaticFixtureSource}=await import(pathToFileURL(resolve('fixtures/static.ts')))
for(const suite of ['compiler-diagnostics','extraction-diagnostics']) {
 const run=spawnSync('pnpm',['exec','vitest','bench',suite,'--run'],{env:{...process.env,BENCHMARK_ROUNDS:'1'},stdio:'inherit',timeout:300000})
 assert.equal(run.status,0,run.error?.message||suite)
 const report=JSON.parse(await readFile(`.results/${suite}/report.json`,'utf8'))
 const missing=report.metrics.filter(metric=>!report.samples.some(sample=>sample.metricId===metric.id)).map(metric=>metric.id)
 assert.equal(report.variants.length,4)
 for(const variant of report.variants) {
  const samples=report.samples.filter(sample=>sample.variantId===variant.id)
  const values=Object.fromEntries(samples.map(sample=>[sample.metricId,sample.value]))
  if(finalMode) {
   assert.equal(samples.length,30)
   assert.equal(Object.keys(values).length,30)
   assert.deepEqual(Object.keys(values).sort(),report.metrics.map(metric=>metric.id).sort())
  }
  for(const sample of samples) {
   assert(Number.isFinite(sample.value));assert(report.metrics.some(metric=>metric.id===sample.metricId))
   assert.equal(report.summary.find(row=>row.metricId===sample.metricId&&row.variantId===variant.id).median,sample.value)
  }
  const own=report.artifacts.filter(artifact=>artifact.path.includes(`/workspaces/${variant.id}/`))
  const final=own.find(artifact=>artifact.path.endsWith('/dist/output.css'))
  assert(final)
  const css=await readFile(resolve('..',final.path))
  for(const marker of getStaticFixtureSource(variant.fixtureId).expectedCSSMarkers)assert(css.includes(marker))
  assert.equal(values['final-css-raw-bytes'],css.length)
  assert.equal(values['final-css-gzip-bytes'],gzipSync(css).length)
  assert.equal(values['final-css-brotli-bytes'],brotliCompressSync(css).length)
  let phases,modeArtifacts
  if(finalMode) {
   assert.equal(own.length,4)
   modeArtifacts=[]
   for(const [output,suffix] of [['final','/dist/output.css'],['generated','/diagnostic/generated.css'],['native-only','/diagnostic/native-only.css']]) {
    const artifact=own.find(item=>item.path.endsWith(suffix));assert(artifact)
    const buffer=await readFile(resolve('..',artifact.path))
    const bytes={raw:buffer.length,gzip:gzipSync(buffer).length,brotli:brotliCompressSync(buffer).length}
    for(const [compression,length] of Object.entries(bytes))assert.equal(values[`${output}-css-${compression}-bytes`],length)
    assert.equal(artifact.rawBytes,bytes.raw);assert.equal(artifact.gzipBytes,bytes.gzip);assert.equal(artifact.brotliBytes,bytes.brotli)
    assert.equal(artifact.sha256,hash(buffer))
    modeArtifacts.push({mode:output,bytes,sha256:hash(buffer)})
   }
   const artifact=own.find(item=>item.path.endsWith('/diagnostic/phase-observations.json'));assert(artifact)
   const buffer=await readFile(resolve('..',artifact.path));assert.equal(artifact.sha256,hash(buffer))
   phases=JSON.parse(buffer)
   assert.equal(phases.length,13)
   assert.deepEqual(phases.map(phase=>phase.metricId).sort(),report.metrics.filter(metric=>metric.unit==='ms').map(metric=>metric.id).sort())
   const total=phases.find(phase=>phase.metricId==='public-pipeline-total-ms')
   let end=total.startedAt
   for(const phase of phases) {
    assert.equal(phase.status,'ok')
    assert.equal(values[phase.metricId],phase.endedAt-phase.startedAt)
    assert(phase.endedAt>=phase.startedAt)
    if(phase===total)continue
    assert(phase.startedAt>=end&&phase.endedAt<=total.endedAt)
    end=phase.endedAt
   }
  }
  console.log(JSON.stringify({suite,variant:variant.id,samples:samples.length,cssBytes:css.length,cssHash:hash(css),phases,modeArtifacts,pass:true}))
 }
 console.log(JSON.stringify({suite,variants:report.variants.length,metrics:report.metrics.length,samples:report.samples.length,summary:report.summary.length,missingMetricIds:missing,mode}))
 if(finalMode)assert.deepEqual(missing,[])
}
if(mode==='consumer') {
 for(const suite of ['startup-diagnostics','build-diagnostics']) {
  const run=spawnSync(process.execPath,['--import','tsx',new URL('./benchmark-vite-reports.mjs',import.meta.url).pathname,suite],{stdio:'inherit',timeout:900000})
  assert.equal(run.status,0,run.error?.message||suite)
 }
 // Only the disposable copy is changed; no checked-in snapshot is written.
 const file=resolve('build-path-diagnostics/update-snapshot.mjs')
 const source=await readFile(file,'utf8')
 const old="const snapshotFile = resolve(__dirname, 'snapshot.json')"
 assert(source.includes(old))
 const directory=resolve('.results/build-path-consumer');await mkdir(directory,{recursive:true})
 await writeFile(file,source.replace(old,"const snapshotFile = resolve(benchmarkRoot, '.results/build-path-consumer/snapshot.json')"))
 const run=spawnSync(process.execPath,[file],{stdio:'inherit',timeout:30000});assert.equal(run.status,0)
 const snapshot=JSON.parse(await readFile(resolve(directory,'snapshot.json'),'utf8'))
 const reports=Object.fromEntries(await Promise.all(['startup-diagnostics','build-diagnostics','compiler-diagnostics','extraction-diagnostics'].map(async suite=>[suite,JSON.parse(await readFile(`.results/${suite}/report.json`,'utf8'))])))
 assert.equal(snapshot.results.length,4)
 let checked=0
 for(const row of snapshot.results) {
  for(const [suite,group] of [['startup-diagnostics',row.cli.startup],['startup-diagnostics',row.vite.startup],['build-diagnostics',row.cli.build],['build-diagnostics',row.vite.build],['compiler-diagnostics',row.compiler],['extraction-diagnostics',row.extraction]]) {
   for(const [metricId,metric] of Object.entries(group.metrics)) {
    const summary=reports[suite].summary.find(item=>item.variantId===group.variantId&&item.metricId===metricId);assert(summary)
    for(const key of ['min','median','mean','max'])assert.equal(metric[key],summary.unit==='ms'?Math.round(summary[key]*100)/100:Math.round(summary[key]))
    assert.equal(metric.unit,summary.unit);assert.equal(metric.sampleCount,summary.sampleCount);checked++
   }
  }
 }
 for(const [suite,report] of Object.entries(reports))assert.deepEqual(snapshot.sourceLimits[suite],report.limits)
 console.log(JSON.stringify({consumer:'build-path-diagnostics',actualReports:4,variants:24,summaryCells:checked,sourceLimitsPreserved:true,snapshotWrittenOnlyInDisposableResults:true,pass:true}))
}
