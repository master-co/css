import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const workspace = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { resolveConfig, preprocessCSS } = await import(require.resolve('vite'))
const root = realpathSync(mkdtempSync(join(workspace, 'packages/vite/tmp/module-host-controls-')))
try {
  const file = join(root, 'style.module.css')
  const config = await resolveConfig({ root, cacheDir: join(root, '.vite'), configFile: false, base: '/base/', logLevel: 'silent' }, 'serve')
  const source = '@import "./child.css" layer(guard);:export{rootToken:root}'
  writeFileSync(join(root, 'child.css'), '.child{color:red}:export{childToken:child}')
  const result = await preprocessCSS(source, file, config)
  assert.equal(result.modules.rootToken, 'root');assert.equal(result.modules.childToken, undefined)
  console.log(JSON.stringify({ control: 'pure Vite ICSS inside imported layer', modules: result.modules, css: result.code, result: 'PASS' }))
  mkdirSync(join(root, 'public'));writeFileSync(join(root, 'public/external.css'), '.external{color:blue}')
  writeFileSync(join(root, 'child.css'), '@import "/base/external.css";.child{color:red}')
  let error
  try { await preprocessCSS(source, file, config) } catch (cause) { error = String(cause) }
  assert.match(error, /ENOENT.*\/base\/external\.css/)
  console.log(JSON.stringify({ control: 'pure Vite public import with base prefix', error, result: 'PASS' }))
} finally { rmSync(root, { recursive: true, force: true }) }
