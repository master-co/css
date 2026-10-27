import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { build } from 'vite'
import { expect, test } from 'vitest'
import { createCompilerSync } from '@master/css-compiler/node'
import { prepareBuildStylesheet } from '../../src/utils/build-stylesheet-delivery'
import { localStylesheets, registerLocalStylesheet } from '../../src/utils/local-stylesheet'
import masterCSS from '../../src/core'

const emittedGlobals = { variables: {}, keyframes: {}, keyframeSlots: [], suppressedKeyframes: [] }

test('graph fragment names depend on rendered CSS, not on host stylesheet paths', () => {
  using compiler = createCompilerSync()
  const extracted = (root: string) => {
    // Graph IDs are host files; temporary delivery URLs digest them.
    const href = `./master-css-source-${createHash('sha256').update(join(root, 'src/child.css')).digest('hex').slice(0, 20)}.css`
    return { css: `@import "${href}";.entry{color:red}`, stylesheets: [{ id: join(root, 'src/child.css'), href, css: '.child{color:blue}' }], diagnostics: [], emittedGlobals }
  }
  // Hosts publish each asset's href and CSS; graph IDs stay internal.
  const prepare = (root: string) => {
    const prepared = prepareBuildStylesheet(compiler, 'body{margin:0}#managed{--slot:0}', '#managed{--slot:0}', extracted(root))
    return prepared && { source: prepared.source, assets: prepared.assets.map(({ href, css }) => ({ href, css })) }
  }
  const first = prepare('/home/ci/project')
  expect(first?.assets.map(asset => asset.css).join('\n')).toContain('.child{color:blue}')
  expect(prepare('/Users/dev/checkout')).toEqual(first)
  const changed = prepareBuildStylesheet(compiler, 'body{margin:0}#managed{--slot:0}', '#managed{--slot:0}', { ...extracted('/home/ci/project'), css: extracted('/home/ci/project').css.replace('red', 'green') })
  expect(changed?.source).not.toBe(first?.source)
})

test('local slots identify modules relative to the project root', () => {
  const result = { code: '.a{color:red}', transformed: true, diagnostics: [], dependencies: [] }
  const slot = (root: string, id: string) => {
    const context = { config: { root } } as any
    try { return registerLocalStylesheet(context, id, result) } finally { localStylesheets(context).clear() }
  }
  const first = slot('/home/ci/project', '/home/ci/project/src/Card.astro?astro&type=style&index=0&lang.css')
  expect(slot('/Users/dev/checkout', '/Users/dev/checkout/src/Card.astro?astro&type=style&index=0&lang.css')).toBe(first)
  expect(slot('/home/ci/project', '/home/ci/project/src/Card.astro?astro&type=style&index=1&lang.css')).not.toBe(first)
  expect(slot('/home/ci/project', '\0/home/ci/packages/ui/card.css')).toBe(slot('/Users/dev/checkout', '\0/Users/dev/packages/ui/card.css'))
})

test('production output is identical when the project moves', async () => {
  const parent = join(process.cwd(), 'tmp'); mkdirSync(parent, { recursive: true })
  const roots = ['checkout-a-', 'checkout-b-'].map(prefix => realpathSync(mkdtempSync(join(parent, prefix))))
  try {
    const outputs: [string, string][][] = []
    for (const root of roots) {
      mkdirSync(join(root, 'src'))
      writeFileSync(join(root, 'index.html'), '<main class="card a b"></main><script type="module" src="/src/main.ts"></script>')
      writeFileSync(join(root, 'src/main.ts'), 'import "./app.css";import "./a.css";import "./b.css";')
      writeFileSync(join(root, 'src/app.css'), '@import "@master/css";@utility card { display: grid; }')
      // Two locals make their composition order observable in the graph.
      writeFileSync(join(root, 'src/a.css'), '.a{@media all {display:block;}}')
      writeFileSync(join(root, 'src/b.css'), '.b{@media all {display:inline-flex;}}')
      const result = await build({ root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode: 'progressive' }), build: { write: false } })
      if (Array.isArray(result) || 'on' in result) throw new Error('Expected one build output')
      outputs.push(result.output.filter(asset => asset.type === 'asset' && /\.(?:css|json|html|bin)$/.test(asset.fileName))
        .map(asset => [asset.fileName, String(asset.type === 'asset' ? asset.source : '')] as [string, string])
        .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0))
    }
    const fileNames = outputs[0].map(([fileName]) => fileName)
    expect(fileNames).toContainEqual(expect.stringMatching(/master-css-program.*\.bin$/))
    expect(fileNames).toContainEqual(expect.stringMatching(/master-css-[0-9a-f]{20}-\d+\.css$/))
    expect(outputs[1]).toEqual(outputs[0])
    for (const [, source] of outputs[0]) expect(source).not.toContain(roots[0])
  } finally {
    for (const root of roots) rmSync(root, { recursive: true, force: true })
  }
})
