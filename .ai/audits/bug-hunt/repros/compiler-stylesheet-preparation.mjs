import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { prepareStylesheet, transformStylesheet } from '../../../../packages/compiler/dist/stylesheet/index-public.js'

const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const sass = createRequire(require.resolve('vite'))('sass')
const root = mkdtempSync(join(tmpdir(), 'built-prepared-stylesheet-'))
try {
  mkdirSync(join(root, 'parts'))
  const partial = join(root, 'parts/_rules.scss'), token = join(root, 'parts/tokens.css')
  writeFileSync(token, '@utilities { paint { padding: 2rem; } }')
  writeFileSync(join(root, 'tokens.css'), '@utilities { paint { padding: 99rem; } }')
  writeFileSync(partial, '@reference "./tokens.css"; .card { @compose paint; }')
  for (const syntax of ['scss', 'sass']) {
    const file = join(root, `entry.${syntax}`), source = syntax === 'sass' ? '@use "parts/rules"\n' : '@use "parts/rules";'
    const prepared = await prepareStylesheet(file, source, { projectDir: root, loadSass: () => sass })
    assert.ok(prepared.sourceMap);assert.ok(prepared.dependencies.includes(partial))
    const result = await transformStylesheet('\0prepared:entry.css', prepared.source, {
      baseManifest: { version: 1, utilities: [] }, projectDir: root,
      delivery: { baseFile: prepared.baseFile, sourceMap: prepared.sourceMap,
        entryURL: '/entry.css', stylesheetURL: id => '/' + Buffer.from(id).toString('hex') + '.css', resourceURL: id => id }
    })
    assert.match(result.code, /padding:2rem/);assert.doesNotMatch(result.code, /99rem/);assert.ok(result.dependencies.includes(token))
    console.log(JSON.stringify({ syntax, pass: true, css: result.code, dependencies: prepared.dependencies, mappedReference: token }))
  }
  console.log(JSON.stringify({ artifacts: Object.fromEntries(['index-public.js', 'public.js', 'index.js', 'source.js'].map(name => [name, createHash('sha256').update(readFileSync(new URL('../../../../packages/compiler/dist/stylesheet/' + name, import.meta.url))).digest('hex')])) }))
} finally { rmSync(root, { recursive: true, force: true }) }
