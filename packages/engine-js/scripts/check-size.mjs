// Size gate of the JS runtime engine plan: the minified JS engine and the CDN default
// page's total download, the global bundle that inlines the engine and the default
// program it fetches, must each stay within their brotli budgets.
//
//   node packages/engine-js/scripts/check-size.mjs [--report]
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { brotliCompressSync, constants } from 'node:zlib'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const { Rolldown } = await import(createRequire(join(root, 'package.json')).resolve('tsdown'))
const reportOnly = process.argv.includes('--report')

const BUDGETS = {
  engine: 30 * 1024,
  cdnTotal: 55 * 1024
}
const CDN_FILES = [
  'packages/runtime/dist/global.min.js',
  'packages/runtime/dist/default-program.bin'
]

const brotli = (source) => brotliCompressSync(source, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).byteLength
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`

/** Bundles the engine entry the way the CDN global bundle inlines it. */
async function bundleEngine() {
  const bundle = await Rolldown.rolldown({
    input: join(root, 'packages/engine-js/src/index.ts'),
    platform: 'browser',
    logLevel: 'silent'
  })
  try {
    const { output } = await bundle.generate({ format: 'esm', minify: true })
    return Buffer.from(output.filter((chunk) => chunk.type === 'chunk').map((chunk) => chunk.code).join('\n'))
  } finally {
    await bundle.close()
  }
}

const engine = await bundleEngine()
const rows = [['@master/css-engine-js (minified)', engine.byteLength, brotli(engine)]]
let cdnTotal = 0
for (const file of CDN_FILES) {
  if (!existsSync(join(root, file))) continue
  const source = readFileSync(join(root, file))
  const compressed = brotli(source)
  cdnTotal += compressed
  rows.push([file, source.byteLength, compressed])
}

const failures = []
if (rows[0][2] > BUDGETS.engine) failures.push(`JS engine ${kb(rows[0][2])} br exceeds ${kb(BUDGETS.engine)}`)
if (cdnTotal > BUDGETS.cdnTotal) failures.push(`CDN total ${kb(cdnTotal)} br exceeds ${kb(BUDGETS.cdnTotal)}`)

for (const [name, raw, compressed] of rows) process.stdout.write(`${name.padEnd(64)} raw ${kb(raw).padStart(9)}  br ${kb(compressed).padStart(8)}\n`)
process.stdout.write(`${'CDN default page total'.padEnd(64)} ${''.padStart(13)}  br ${kb(cdnTotal).padStart(8)} (budget ${kb(BUDGETS.cdnTotal)})\n`)
process.stdout.write(`${'JS engine budget'.padEnd(64)} ${''.padStart(13)}  br ${kb(BUDGETS.engine).padStart(8)}\n`)
for (const failure of failures) process.stdout.write(`${reportOnly ? 'over budget' : 'FAIL'}: ${failure}\n`)
if (failures.length && !reportOnly) process.exitCode = 1
