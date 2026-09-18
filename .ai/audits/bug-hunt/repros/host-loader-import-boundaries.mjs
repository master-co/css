import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const loaders = {}
for (const name of ['next', 'webpack']) {
  const candidate = process.env[`MASTER_${name.toUpperCase()}_LOADER`]
  const url = candidate ? pathToFileURL(resolve(candidate)) : new URL(`../../../../packages/${name}/dist/stylesheet-loader.js`, import.meta.url)
  loaders[name] = (await import(url.href)).default
}
const root = mkdtempSync(join(tmpdir(), 'host-loader-boundaries-'))
const observations = []
try {
  const entry = join(root, 'entry.css'), child = join(root, 'child.css')
  writeFileSync(child, '@import "https://external.invalid/font.css";@master entry;.card{color:red}')
  for (const qualifier of ['', ' layer(cards)', ' supports(display:grid) print']) {
    for (const rootEntry of [false, true]) {
      const source = `@import "./child.css"${qualifier};${rootEntry ? '@master entry;' : ''}.root{display:block}`
      writeFileSync(entry, source)
      for (const [name, loader] of Object.entries(loaders)) {
        const dependencies = []
        const result = await new Promise(resolve => {
          loader.call({ resourcePath: entry, rootContext: root, addDependency: file => dependencies.push(file),
            addContextDependency() {}, getOptions: () => ({}),
            async: () => (error, code, map) => resolve({ error: error ? String(error) : null, code, map }) }, source)
        })
        observations.push({ name, qualifier, rootEntry, dependencies, ...result })
      }
    }
  }
} finally { rmSync(root, { recursive: true, force: true }) }
console.log(JSON.stringify({ observations, scope: 'Delivered real loader functions with isolated loader contexts; no actual host build/browser or external requests. Success here does not prove retained child asset publication.' }, null, 2))
