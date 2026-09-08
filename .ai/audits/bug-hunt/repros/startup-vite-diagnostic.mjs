import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

assert(process.cwd().includes('master-css-bh-isolated-'))
const fixtureId = process.env.BH_FIXTURE || 'minimal'
assert(['minimal', 'docs', 'dashboard', 'stress-css'].includes(fixtureId))
const workspace = resolve('.results/audit-startup-vite', fixtureId)
const output = resolve(workspace, 'diagnostic-result.json')
const result = spawnSync(process.execPath, ['--import', 'tsx', 'startup-diagnostics/run-diagnostic.ts',
  '--workspace', workspace, '--fixture-id', fixtureId, '--tool-id', 'master-vite-startup-diagnostic',
  '--variant-id', `${fixtureId}-master-vite-startup-diagnostic`, '--round', '0', '--output', output],
{ encoding: 'utf8', timeout: 120000 })
process.stdout.write(result.stdout || '')
process.stderr.write(result.stderr || '')
const { findCSSFiles, readFiles } = await import(pathToFileURL(resolve('shared/runner.ts')).href)
const { getStaticFixtureSource } = await import(pathToFileURL(resolve('fixtures/static.ts')).href)
const cssFiles = await findCSSFiles(resolve(workspace, 'dist'))
const css = await readFiles(cssFiles)
const fixture = getStaticFixtureSource(fixtureId)
const data = { status: result.status, error: result.error?.message,
  completedDiagnostic: existsSync(output), cssFiles, cssBytes: css.byteLength,
  markers: fixture.expectedCSSMarkers.map(marker => ({ marker, present: css.includes(marker) })),
  probeFiles: existsSync(resolve(workspace, '.startup-probes')) ? readdirSync(resolve(workspace, '.startup-probes')) : [] }
if (existsSync(output)) data.result = JSON.parse(readFileSync(output, 'utf8'))
writeFileSync(fileURLToPath(new URL(`../evidence/0067-vite-startup${fixtureId === 'minimal' ? '' : '-' + fixtureId}.json`, import.meta.url)), JSON.stringify(data, null, 2))
console.log(JSON.stringify({ fixtureId, status: data.status, completedDiagnostic: data.completedDiagnostic, cssBytes: data.cssBytes, markers: data.markers, probes: data.probeFiles.length, samples: data.result?.samples.length }))
process.exitCode = result.status ?? 1
