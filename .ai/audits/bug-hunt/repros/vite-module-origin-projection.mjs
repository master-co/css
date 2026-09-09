import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const workspace = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { resolveConfig, preprocessCSS } = await import(require.resolve('vite'))
const rootDir = mkdtempSync(join(workspace, 'packages/vite/tmp/module-origin-projection-'))
try {
  const file = join(rootDir, 'style.module.css'), child = join(rootDir, 'child.css')
  const source = '@import "./child.css" layer(guard) supports(display:grid) screen and (min-width:700px);.local{display:inline-flex}'
  writeFileSync(child, '@import "https://external.test/child.css";.child{@compose p:2rem;}')
  const originals = new Map(), projected = new Map(), trace = []
  const key = node => [node.type, node.source?.start?.offset, node.source?.end?.offset].join(':')
  const projection = { postcssPlugin: 'audit-module-origin-projection',
    prepare({ root }) { originals.set(file, root.clone()) },
    Once(root, { postcss }) {
      root.walk(node => {
        const input = node.source?.input
        if (input?.file && !originals.has(input.file)) originals.set(input.file, postcss.parse(input.css, { from: input.file }))
      })
    },
    OnceExit(root) {
      const transformed = new Map()
      root.walk(node => {
        const input = node.source?.input
        if (input?.file) transformed.set(input.file + ':' + key(node), node)
      })
      for (const [id, original] of originals) {
        for (const node of [...original.nodes]) {
          if (node.type === 'atrule' && node.name.toLowerCase() === 'import') continue
          const next = transformed.get(id + ':' + key(node))
          trace.push({ id, key: key(node), found: Boolean(next) })
          if (next) node.replaceWith(next.clone())
          else node.remove()
        }
        projected.set(id, original.toString())
      }
    }
  }
  const config = await resolveConfig({ root: rootDir, configFile: false, css: { modules: { generateScopedName: (name, file) => basename(file).replaceAll('.', '_') + '_' + name }, postcss: { plugins: [projection] } } }, 'serve')
  const result = await preprocessCSS(source, file, config)
  console.log(JSON.stringify({ modules: result.modules, code: result.code, projected: [...projected], trace }))
  assert.equal(result.modules.child, 'style_module_css_child')
  assert.ok(projected.get(file).includes('@import "./child.css" layer(guard) supports(display:grid) screen and (min-width:700px)'))
  assert.ok(projected.get(child).includes('@import "https://external.test/child.css"'))
  assert.ok(projected.get(child).includes('.style_module_css_child{@compose p:2rem;}'))
} finally { rmSync(rootDir, { recursive: true, force: true }) }
