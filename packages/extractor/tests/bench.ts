/**
 * Microbenchmark: legacy vs new extractLatentClasses on real workspace
 * files. Run with `pnpm tsx tests/bench.ts` (not part of the vitest suite).
 *
 * Methodology:
 *   - Glob real source files in the workspace (examples + site MDX).
 *   - For each file, run both implementations N times, take median.
 *   - Print per-file ms + total + speedup factor.
 */
import legacy from './_legacy-extract-latent-classes'
import { extractLatentClasses as nuevo } from '../src'
import fs from 'node:fs'
import path from 'node:path'
import fastGlob from 'fast-glob'
const glob = { sync: fastGlob.sync.bind(fastGlob) }
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ITERATIONS = 20
const WARMUP = 3

const workspaceRoot = path.resolve(__dirname, '..', '..', '..')
const files = [
    ...glob.sync(['examples/*/src/**/*.{ts,tsx,html,vue,svelte,astro}', 'examples/*/index.html'], {
        cwd: workspaceRoot,
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**'],
        deep: 4,
    }),
    ...glob.sync('site/app/[locale]/**/content.mdx', {
        cwd: workspaceRoot,
        absolute: true,
        ignore: ['**/node_modules/**'],
    }),
]

function median(arr: number[]): number {
    const sorted = [...arr].sort((a, b) => a - b)
    const m = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2
}

function timeIt(fn: () => unknown): number {
    const t0 = performance.now()
    fn()
    return performance.now() - t0
}

console.log(`File count: ${files.length}, ITERATIONS=${ITERATIONS} (warmup ${WARMUP})\n`)
console.log('| File | size | legacy ms | new ms | speedup |')
console.log('|------|------|-----------|--------|---------|')

let totalLegacy = 0
let totalNew = 0
for (const file of files) {
    const content = fs.readFileSync(file, 'utf8')
    if (!content.length) continue

    // Warmup
    for (let i = 0; i < WARMUP; i++) { legacy(content); nuevo(content) }

    const legacyTimes: number[] = []
    const newTimes: number[] = []
    for (let i = 0; i < ITERATIONS; i++) {
        legacyTimes.push(timeIt(() => legacy(content)))
        newTimes.push(timeIt(() => nuevo(content)))
    }
    const lMed = median(legacyTimes)
    const nMed = median(newTimes)
    totalLegacy += lMed
    totalNew += nMed

    const rel = path.relative(workspaceRoot, file).replace(/\|/g, '\\|')
    console.log(`| ${rel} | ${content.length} | ${lMed.toFixed(3)} | ${nMed.toFixed(3)} | ${(lMed / nMed).toFixed(2)}× |`)
}

console.log('\n| **TOTAL median sum** | | ' + totalLegacy.toFixed(2) + ' ms | ' + totalNew.toFixed(2) + ' ms | ' + (totalLegacy / totalNew).toFixed(2) + '× |')

// ─── Cache-hit benchmark using the full insert() pipeline ────────────────────
// Single-pass extract is ~7% faster, but the real wins are the per-source
// content-hash cache and per-class generateValidRules memo. Demonstrate both:
//   1. Same (source, content) re-inserted → near-zero (content-hash hit)
//   2. N files all containing the same class → only first runs validator

import('../src').then(async ({ default: CSSExtractor }) => {
    console.log('\n## insert() cache benchmark\n')

    // Scenario 1: HMR re-fire (same content twice) — must short-circuit.
    {
        const ex = await new CSSExtractor({ config: {} as any }).init()
        const html = '<div className="bg:white fg:black m:8 p:8 r:4 h:full bg:blue@hover">x</div>'
        const t1 = timeIt(() => ex.insert('foo.tsx', html))
        // Wait for promise (insert is async)
        await new Promise(r => setImmediate(r))
        const t2 = timeIt(() => ex.insert('foo.tsx', html))
        console.log(`HMR re-fire (same source + content):`)
        console.log(`  first insert : ${t1.toFixed(3)} ms`)
        console.log(`  second insert: ${t2.toFixed(3)} ms (content-hash hit)`)
        console.log(`  speedup:       ${(t1 / Math.max(t2, 0.001)).toFixed(1)}×`)
    }

    // Scenario 2: 200 different files all using `bg:white` — validator runs once.
    {
        const ex = await new CSSExtractor({ config: {} as any }).init()
        const sharedClass = '<div className="bg:white">shared</div>'
        const t = timeIt(async () => {
            for (let i = 0; i < 200; i++) {
                await ex.insert(`f${i}.tsx`, sharedClass)
            }
        })
        await new Promise(r => setImmediate(r))
        console.log(`\n200 files × identical class (bg:white):`)
        console.log(`  total: ${t.toFixed(2)} ms`)
        console.log(`  per-file mean: ${(t / 200).toFixed(3)} ms`)
        console.log(`  unique classes validated: ${ex.validClasses.size}`)
    }
}).catch(e => console.error(e))
