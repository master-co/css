import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { configuredExampleCSS, configuredMarkupClasses } from '../reference/configured-example'
import { compileRenderedStylesheet } from '@master/css-compiler/stylesheet'
import { deliveryFences, deliveryFixture } from '../tests/delivery-examples'
import preset from '../utils/preset-manifest'
import { renderMigrationExample } from '../tests/migration-examples'

const rootURL = new URL('../../', import.meta.url)
const article = (path: string) => readFileSync(new URL(`../content/${path}/content.mdx`, import.meta.url), 'utf8')

function namedFence(source: string, name: string) {
  const fence = deliveryFences(source).find(fence => fence.name === name)
  assert.ok(fence, `Missing article example: ${name}`)
  return fence.text
}

test('Global styles print utility compiles from the displayed configuration', () => {
  const source = article('guide/global-styles')
  const example = /<DemoConfiguredExample name="global-related-guides"[\s\S]*?source=\{`([\s\S]*?)`\} html=\{`([\s\S]*?)`\}/.exec(source)
  assert.ok(example, 'Custom utilities must include their configuration and markup')
  const css = configuredExampleCSS(example[1], configuredMarkupClasses(example[2]))
  assert.match(css, /@media print\s*\{\s*\.print-hidden\s*\{\s*display:\s*none/)
  assert.match(css, /\.flow\s*\{\s*display:\s*grid;\s*gap:\s*var\(--spacing-md\)/)
  assert.match(css, /\.content-auto\s*\{\s*content-visibility:\s*auto/)
})

test('Global styles split files form one usable app entry', async () => {
  const files = deliveryFixture()
  try {
    const fences = deliveryFences(article('guide/global-styles'))
    for (const fence of fences.filter(item => item.language === 'css' && item.name.startsWith('styles/'))) files.write(fence.name, fence.text)
    const entry = join(files.root, 'styles/app.css')
    const result = await compileRenderedStylesheet(entry, readFileSync(entry, 'utf8'), { baseManifest: preset, projectDir: files.root, classes: ['notice', 'p-card'] })
    assert.deepEqual(result.diagnostics.filter(item => item.severity === 'error'), [])
    assert.match(result.css, /\.notice\s*\{/)
    assert.match(result.css, /body\s*\{/)
    assert.match(result.css, /padding:\s*var\(--spacing-card\)/)
    assert.match(result.css, /--spacing-card:\s*1\.5rem/)
  } finally { files.dispose() }
})

test('Next.js Blog Badge renders both displayed variants with valid foreground and background CSS', () => {
  const source = article('blog/master-css-next')
  const component = namedFence(source, 'Badge.tsx')
  for (const tone of ['blue', 'neutral']) {
    const html = renderMigrationExample(component, 'Badge', { tone })
    assert.equal(html, namedFence(source, `${tone}.html`).trim())
    const classes = configuredMarkupClasses(html)
    assert.ok(classes.includes(`fg-text-${tone}`))
    const css = configuredExampleCSS('', classes)
    assert.ok(css.includes(`color:var(--color-text-${tone})`), css)
    assert.match(css, /background-color:color-mix\(in [^,]+,var\(--color-(blue|neutral)\) 10%,transparent\)/)
  }
})

test('Vite Blog source covers both static states while empty HTML supplies no pre-rendered button rules', () => {
  const source = article('blog/bootstrapping-master-css-with-vite')
  const root = mkdtempSync(join(tmpdir(), 'master-writing-vite-'))
  try {
    const write = (name: string, text: string) => {
      mkdirSync(dirname(join(root, name)), { recursive: true })
      writeFileSync(join(root, name), text)
    }
    write('package.json', JSON.stringify({ type: 'module', devDependencies: { vite: '*' } }))
    for (const name of ['src/main.js', 'index.html']) write(name, namedFence(source, name))
    // The article assumes the linked integration guide's loaded preset entry.
    write('src/style.css', "@import '@master/css';")
    mkdirSync(join(root, 'node_modules/@master'), { recursive: true })
    for (const name of ['css', 'css-vite', 'css-runtime']) {
      symlinkSync(fileURLToPath(new URL(`node_modules/@master/${name}`, rootURL)), join(root, 'node_modules/@master', name), 'dir')
    }
    symlinkSync(fileURLToPath(new URL('node_modules/vite', rootURL)), join(root, 'node_modules/vite'), 'dir')
    for (const mode of ['static', 'pre-render']) {
      write('vite.config.js', `import masterCSS from '@master/css-vite'; export default { plugins: [masterCSS({ mode: '${mode}' })] }`)
      const built = spawnSync(process.execPath, [fileURLToPath(new URL('node_modules/vite/bin/vite.js', rootURL)), 'build'], { cwd: root, encoding: 'utf8', timeout: 30000 })
      assert.equal(built.status, 0, built.stderr || built.stdout)
      const html = readFileSync(join(root, 'dist/index.html'), 'utf8')
      assert.match(html, /<div id="app"><\/div>/)
      assert.doesNotMatch(html, /<button/)
      const stylesheets = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map(match => match[1])
      const visited = new Set<string>()
      const readCSS = (file: string): string => {
        if (visited.has(file)) return ''
        visited.add(file)
        const text = readFileSync(file, 'utf8')
        const imports = [...text.matchAll(/@import\s+["']([^"']+)["']/g)]
        return text + imports.map(match => readCSS(resolve(dirname(file), match[1]))).join('\n')
      }
      const css = stylesheets.map(href => readCSS(join(root, 'dist', href))).join('\n')
        + [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(match => match[1]).join('\n')
      for (const tone of ['blue', 'neutral']) {
        assert.equal(css.includes(`.bg-${tone}{`), mode === 'static', `${mode}: ${tone} coverage`)
      }
      const assets = readdirSync(join(root, 'dist/assets'))
      assert.ok(!assets.some(name => /\.wasm$|master-css-program|master-css-manifest/.test(name)))
    }
  } finally { rmSync(root, { recursive: true, force: true }) }
})
