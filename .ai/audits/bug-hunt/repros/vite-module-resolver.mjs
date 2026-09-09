import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, realpathSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { preprocessCSS, resolveConfig } = await import(require.resolve('vite'))
const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-module-resolver-')))
try {
  const packageRoot = join(root, 'node_modules/test-modules')
  mkdirSync(packageRoot, { recursive: true })
  writeFileSync(join(packageRoot, 'package.json'), JSON.stringify({ name: 'test-modules', exports: { '.': { style: './shared.module.css', default: './wrong.js' } } }))
  writeFileSync(join(packageRoot, 'wrong.js'), 'throw new Error("CSS style condition was not used")')
  for (const directory of [root, packageRoot]) {
    writeFileSync(join(directory, 'shared.module.css'), '.shared{composes:leaf from "./leaf.module.css";color:red}')
    writeFileSync(join(directory, 'leaf.module.css'), '.leaf{font-weight:bold}')
  }
  const config = await resolveConfig({ root, configFile: false, resolve: { alias: { '@shared': join(root, 'shared.module.css') } }, css: { devSourcemap: true, modules: { generateScopedName: 'scope_[local]' } } }, 'build')
  for (const specifier of ['./shared.module.css', '@shared', 'test-modules']) {
    const source = `.example{composes:shared from ${JSON.stringify(specifier)};background:blue}`, calls = []
    const original = await preprocessCSS(source, join(root, 'style.module.css'), config)
    const tracked = await preprocessCSS(source, join(root, 'style.module.css'), {
      ...config,
      createResolver(options) {
        const resolve = config.createResolver(options)
        return async (...args) => {
          const result = await resolve(...args)
          calls.push({ args, result })
          return result
        }
      }
    })
    assert.equal(tracked.code, original.code)
    assert.deepEqual(tracked.modules, original.modules)
    const expectedDirectory = specifier === 'test-modules' ? packageRoot : root
    assert.ok(calls.some(call => call.result === join(expectedDirectory, 'shared.module.css')))
    assert.ok(calls.some(call => call.result === join(expectedDirectory, 'leaf.module.css')))
    console.log(JSON.stringify({ specifier, code: tracked.code, modules: tracked.modules, originalDeps: [...original.deps ?? []], calls, result: 'PASS' }))
  }
  const missing = await preprocessCSS('.example{composes:absent from "./shared.module.css"}', join(root, 'style.module.css'), config)
  console.log(JSON.stringify({ phase: 'missing-export-baseline', modules: missing.modules, result: 'BASELINE' }))
  console.log(JSON.stringify({ comparisons: 3, failures: 0 }))
} finally { rmSync(root, { recursive: true, force: true }) }
