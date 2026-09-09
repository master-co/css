import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const workspace = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { resolveConfig, preprocessCSS } = await import(require.resolve('vite'))
const root = mkdtempSync(join(workspace, 'packages/vite/tmp/module-envelope-'))
try {
  const file = join(root, 'style.module.css')
  mkdirSync(join(root, 'nested'))
  writeFileSync(join(root, 'nested/shared.module.css'), '.shared{color:blue;background:url("./pixel.svg")}')
  const captures = [], origins = []
  const capture = { postcssPlugin: 'audit-module-envelope', OnceExit(root) {
    for (const node of root.nodes) origins.push({ type: node.type, source: node.source?.input?.file, css: node.toString() })
    root.walkAtRules('__master_css_sheet', rule => {
      captures.push({ id: rule.params, css: rule.nodes.map(node => node.toString()).join('\n') })
    })
  } }
  const config = await resolveConfig({ root, configFile: false, css: { modules: { generateScopedName: (name, file) => basename(file).replaceAll('.', '_') + '_' + name }, postcss: { plugins: [capture] } } }, 'serve')
  const source = '@__master_css_sheet child{.child{@compose p:2rem;}}@__master_css_sheet root{.local{composes:shared from "./nested/shared.module.css";display:inline-flex}}'
  const result = await preprocessCSS(source, file, config)
  console.log(JSON.stringify({ modules: result.modules, code: result.code, captures, origins }))
  assert.equal(result.modules.child, 'style_module_css_child')
  assert.equal(result.modules.local, 'style_module_css_local shared_module_css_shared')
  assert.ok(captures.find(part => part.id === 'child').css.includes('.style_module_css_child'))
  assert.ok(captures.find(part => part.id === 'child').css.includes('@compose p:2rem'))
  assert.ok(result.code.includes('.shared_module_css_shared'))
} finally { rmSync(root, { recursive: true, force: true }) }
