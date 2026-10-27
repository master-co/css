// Compare actual saved/current loaders, including warm resource publication.
// node scripts/benchmark-next-module-globals.mjs OLD_LOADER NEW_LOADER OUTPUT.json
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const [before, after, output] = process.argv.slice(2)
if (!output) throw new Error('Expected OLD_LOADER NEW_LOADER OUTPUT.json')
const pair = []
try {
  for (const [label, path] of [['before', before], ['after', after]]) {
    const root = await mkdtemp(join(tmpdir(), 'master-module-globals-bench-'))
    await writeFile(join(root, 'entry.css'), '@master entry;')
    await writeFile(join(root, 'tokens.css'), '@mode ocean{[data-theme=ocean]{@slot;}} @theme{--color-probe:red;} @theme ocean{--color-probe:blue;}')
    const { default: loader } = await import(pathToFileURL(resolve(path)).href)
    const source = '@reference "./tokens.css"; .card { color:var(--color-probe); }'
    const file = join(root, 'Card.module.css')
    await writeFile(file, source)
    pair.push({ label, root, file, loader, source, samples: [] })
  }
  for (let round = 0; round < 18; round++) {
    for (const side of round % 2 ? [...pair].reverse() : pair) {
      const start = performance.now()
      const result = await new Promise((resolve, reject) => {
        side.loader.call({ resourcePath: side.file, rootContext: side.root, addDependency() {},
          async: () => (error, code) => error ? reject(error) : resolve(code) }, side.source)
      })
      if (round >= 3) side.samples.push(performance.now() - start)
      side.localCSSBytes = Buffer.byteLength(result)
    }
  }
  const results = pair.map(({ label, samples, localCSSBytes }) => {
    const sorted = [...samples].sort((a, b) => a - b)
    return { label, samples, medianMs: sorted[Math.floor(sorted.length / 2)], p95Ms: sorted[Math.ceil(sorted.length * .95) - 1], localCSSBytes }
  })
  await writeFile(output, JSON.stringify({ rounds: 18, warmup: 3, alternatingOrder: true, results,
    note: 'One CSS Module with referenced base/mode variables. Baseline incorrectly copies variables to the component; current publishes global resources. Local bytes exclude those assets. This measures the loader, not full HMR.' }, null, 2) + '\n')
  console.log(results)
} finally {
  for (const side of pair) await rm(side.root, { recursive: true, force: true })
}
