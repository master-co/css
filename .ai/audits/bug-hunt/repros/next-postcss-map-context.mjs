import assert from 'node:assert/strict'
import { createRequire, SourceMap } from 'node:module'
import { writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
const require = createRequire(join(process.env.BH_NEXT_PACKAGE_DIR, 'package.json'))
const nextRequire = createRequire(require.resolve('next/package.json'))
const postcss = nextRequire('postcss')
const { normalizeSourceMap } = nextRequire('next/dist/build/webpack/loaders/postcss-loader/src/utils')
const file = resolve('.ai/audits/bug-hunt/tmp/map-context/app/other.module.css')
const source = '.shared{border-top:7px solid red;animation:fade 1s linear infinite}'
const raw = postcss.parse(source, { from: file }).toResult({ from: file, to: file, map: { inline: false, annotation: false, sourcesContent: true } }).map.toJSON()
const before = normalizeSourceMap(JSON.stringify(raw), dirname(file))
const beforeFile = resolve(dirname(file), before.sources[0])
assert.notEqual(beforeFile, file, 'Next treats producer-relative sources as paths relative to process cwd')
const absolute = { ...raw, sources: raw.sources.map(value => new URL(value, pathToFileURL(file)).href) }
const after = normalizeSourceMap(JSON.stringify(absolute), dirname(file))
assert.equal(after.sources[0], pathToFileURL(file).href)
assert.deepEqual(after.sourcesContent, raw.sourcesContent)
assert.equal(after.mappings, raw.mappings)
const position = new SourceMap(after).findEntry(0, 0)
assert.equal(position.originalSource, pathToFileURL(file).href)
assert.equal(position.originalColumn, 0)
const result = { scope: 'Actual Next PostCSS normalizer contract; producer-relative map mismatch and absolute URL remedy, actual host verification separate', cwd: process.cwd(), file, raw, before, beforeFile, after, position, pass: true }
writeFileSync(process.env.BH_NEXT_MAP_CONTEXT_EVIDENCE, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
