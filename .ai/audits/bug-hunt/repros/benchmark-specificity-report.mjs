import assert from 'node:assert/strict'
import { spawnSync, execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { gzipSync, brotliCompressSync } from 'node:zlib'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

assert(process.cwd().includes('master-css-bh-isolated-'))
const repo=fileURLToPath(new URL('../../../../',import.meta.url))
const oldSource=execFileSync('git',['-C',repo,'show','bdd9f25b87305ab47437c30295d59ca6bb88f317:benchmarks/shared/css-structure.ts'],{encoding:'utf8'})
writeFileSync('shared/css-structure-before.ts',oldSource)
const {analyzeCSSStructure:before}=await import(pathToFileURL(resolve('shared/css-structure-before.ts')))
const {analyzeCSSStructure:after}=await import(pathToFileURL(resolve('shared/css-structure.ts')))
const {getStaticFixtureSource}=await import(pathToFileURL(resolve('fixtures/static.ts')))
const run = spawnSync('pnpm', ['exec', 'vitest', 'bench', 'css-structure', '--run'], {
  env: { ...process.env, BENCHMARK_ROUNDS: '1' }, stdio: 'inherit', timeout: 240000
})
const path = '.results/css-structure/report.json'
if (existsSync(path)) {
  const report = JSON.parse(readFileSync(path, 'utf8'))
  const artifacts = report.artifacts.map(artifact => {
    const path = resolve('..', artifact.path)
    assert(path.startsWith(resolve('.results') + '/'))
    const buffer = readFileSync(path)
    const observed = { rawBytes: buffer.length, gzipBytes: gzipSync(buffer).length,
      brotliBytes: brotliCompressSync(buffer).length, sha256: createHash('sha256').update(buffer).digest('hex') }
    for (const [key, value] of Object.entries(observed)) assert.equal(artifact[key], value)
    return { path: artifact.path, ...observed }
  })
  assert.equal(report.variants.length, 16)
  assert.equal(report.samples.length, 336)
  assert(report.samples.every(sample => Number.isFinite(sample.value)))
  assert(report.summary.every(summary => summary.sampleCount === 1))
  for (const variant of report.variants) {
    const rows = report.samples.filter(sample => sample.variantId === variant.id)
    assert.equal(new Set(rows.map(row => row.metricId)).size, 21)
    const own = artifacts.filter(a => a.path.includes(`/workspaces/${variant.id}/`))
    assert(own.length > 0)
    const values = Object.fromEntries(rows.map(row => [row.metricId, row.value]))
    const grouped = ['theme', 'base', 'defaults', 'components', 'utilities', 'other']
      .reduce((sum, layer) => sum + values[`layer-${layer}-style-rule-count`], values['unlayered-style-rule-count'])
    assert.equal(values['style-rule-count'], grouped)
    assert(values['selector-count'] >= values['style-rule-count'])
    const css=Buffer.concat(own.filter(a=>a.path.endsWith('.css')).sort((a,b)=>a.path.localeCompare(b.path)).map(a=>readFileSync(resolve('..',a.path))))
    for(const marker of getStaticFixtureSource(variant.fixtureId).expectedCSSMarkers)assert(css.includes(marker))
    const previous=before(css),current=after(css)
    assert.equal(values['max-selector-specificity-score'],current.maxSelectorSpecificityScore)
    for(const [key,value] of Object.entries(previous))if(key!=='maxSelectorSpecificityScore')assert.deepEqual(current[key],value,`${variant.id}/${key}`)
    for(const sample of rows)assert.equal(report.summary.find(row=>row.variantId===variant.id&&row.metricId===sample.metricId).median,sample.value)
    console.log(JSON.stringify({variant:variant.id,oldSpecificity:previous.maxSelectorSpecificityScore,newSpecificity:current.maxSelectorSpecificityScore,tuple:current.maxSelectorSpecificity,otherMetricsUnchanged:true,artifacts:own,pass:true}))
  }
  console.log(JSON.stringify({ variants: 16, artifacts: artifacts.length, samples: 336, validation: 'PASS' }))
}
assert.equal(run.status,0,run.error?.message||'Original structure suite failed')
assert(existsSync(path))
