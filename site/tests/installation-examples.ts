import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { planMasterCSSSetup, applyMasterCSSSetupPlan } from '../../packages/create/dist/index.js'
import { deliveryFences, deliverySection } from './delivery-examples'
import { installationGuideContent, installationGuideSlugs } from '../utils/installation-content'

const rootURL = new URL('../../', import.meta.url)
const installation = new URL('../content/guide/installation/', import.meta.url)
export const installationRoutes = installationGuideSlugs.map(slug => slug ? `/${slug}` : '')
export function installationSource(route: string) {
  const path = !route ? '(main)/content.mdx' : `${route.slice(1)}/content.mdx`
  return readFileSync(new URL(path, installation), 'utf8')
}

const consolidatedPages: Record<string, string> = {
  react: '/vite', vuejs: '/vite', 'react-router': '/vite', 'tanstack-start': '/vite',
  rspack: '/webpack', rsbuild: '/webpack',
  php: '/server-rendered', rails: '/server-rendered', laravel: '/server-rendered', wordpress: '/server-rendered',
  shopify: '/server-rendered', 'aspnet-core': '/server-rendered', blazor: '/server-rendered', express: '/server-rendered'
}

/** The page that now documents a retired framework or mode route, such as `/blazor/runtime` → `/server-rendered`. */
export function installationPage(route: string) {
  const framework = route.split('/')[1]
  return consolidatedPages[framework] ?? `/${framework}`
}

/** One heading with an explicit `\{#id\}` through the next heading of the same or a higher level. */
export function installationSection(route: string, id: string) {
  const source = installationSource(route)
  const lines = source.split('\n')
  const start = lines.findIndex(line => /^#{2,6} /.test(line) && line.includes(`\\{#${id}\\}`))
  if (start < 0) throw new Error(`${route}: missing section #${id}`)
  const level = lines[start].match(/^#+/)![0].length
  let end = start + 1
  let fenced = false
  for (; end < lines.length; end++) {
    if (/^\s*```/.test(lines[end])) fenced = !fenced
    const heading = !fenced && lines[end].match(/^(#+) /)
    if (heading && heading[1].length <= level) break
  }
  return lines.slice(start, end).join('\n')
}

/** The body of the `<DocumentDisclosure>` with this title, where a page keeps an optional mode. */
export function installationDisclosure(route: string, title: string) {
  const source = installationSource(route)
  const start = source.indexOf(`<DocumentDisclosure title="${title}">`)
  if (start < 0) throw new Error(`${route}: missing disclosure "${title}"`)
  return source.slice(start, source.indexOf('</DocumentDisclosure>', start))
}

/** Exercise the documented handoff without replacing Angular's builder or editing its source entry. */
export async function verifyAngularInstallationExample() {
  const root = mkdtempSync(join(tmpdir(), 'master-doc-angular-'))
  try {
    mkdirSync(join(root, 'src/app'), { recursive: true })
    mkdirSync(join(root, 'node_modules/@master'), { recursive: true })
    symlinkSync(fileURLToPath(new URL('packages/css', rootURL)), join(root, 'node_modules/@master/css'), 'dir')
    writeFileSync(join(root, 'package.json'), JSON.stringify({ type: 'module', dependencies: { '@angular/core': '^22.0.0' } }))
    writeFileSync(join(root, 'src/styles.css'), '')
    const content = await installationGuideContent(fileURLToPath(new URL('../', import.meta.url)), 'angular')
    const fences = deliveryFences(content.markdown)
    const template = fences.find(fence => fence.language === 'html' && fence.text.includes('id="master-check"'))!
    assert.ok(template, 'The rendered template survives the portable export')
    writeFileSync(join(root, 'src/app/app.html'), template.text)
    const plan = planMasterCSSSetup({ root, framework: 'angular', minimal: true, install: false })
    applyMasterCSSSetupPlan(plan, { install: false })
    for (const name of ['master.css', 'src/styles.css']) {
      assert.equal(readFileSync(join(root, name), 'utf8').trim(), fences.find(fence => fence.name === name)!.text.trim())
    }
    const watcher = fences.find(fence => fence.language === 'bash' && fence.text.includes('master-css generate') && fence.text.includes('--watch'))!
    assert.equal(watcher.text.trim(), 'npx master-css generate --output src/master.generated.css --watch')
    const production = fences.find(fence => fence.language === 'bash' && fence.text.includes('npm run build'))!
    assert.equal(production.text.trim(), 'npx master-css generate --output src/master.generated.css\nnpm run build')
    const generated = spawnSync(process.execPath, [fileURLToPath(new URL('packages/cli/dist/bin/index.js', rootURL)), 'generate', '--output', 'src/master.generated.css'], { cwd: root, encoding: 'utf8', timeout: 20000 })
    assert.equal(generated.status, 0, generated.stderr)
    const css = readFileSync(join(root, 'src/master.generated.css'), 'utf8')
    assert.match(css, /\.p-md\s*\{\s*padding:\s*var\(--spacing-md\)/)
    assert.match(css, /\.bg-surface-raised/)
    assert.equal(readFileSync(join(root, 'master.css'), 'utf8').trim(), fences.find(fence => fence.name === 'master.css')!.text.trim())
  } finally { rmSync(root, { recursive: true, force: true }) }
}

export function verifyInstallationExamples() {
  const ledger = JSON.parse(readFileSync(new URL('./docs-quality-review.json', import.meta.url), 'utf8')) as { pages: { url: string }[] }
  const routes = new Set(ledger.pages.map(page => page.url))
  for (const route of installationRoutes) {
    assert.ok(routes.has(`/guide/installation${route}`), `Current review inventory: ${route}`)
    for (const match of installationSource(route).matchAll(/\]\((\/[^)]+)\)|href: ['"](\/[^'"]+)['"]/g)) {
      const href = (match[1] ?? match[2]).split('#')[0]
      assert.ok(routes.has(href), `${route}: missing destination ${href}`)
    }
  }
  for (const mode of [undefined, 'runtime', 'static'] as const) {
    const root = mkdtempSync(join(tmpdir(), 'master-doc-install-'))
    try {
      mkdirSync(join(root, 'src'))
      writeFileSync(join(root, 'package.json'), JSON.stringify({ type: 'module', devDependencies: { vite: '*' }, scripts: { dev: 'vite', build: 'vite build' } }))
      writeFileSync(join(root, 'src/main.js'), "import './style.css'\n")
      writeFileSync(join(root, 'src/style.css'), 'body { margin: 0; }\n')
      const plan = planMasterCSSSetup({ root, mode, install: false })
      assert.equal(plan.framework, 'vite')
      for (const name of ['@master/css', '@master/css-vite', '@master/eslint-config-css', '@master/css-mcp']) assert.ok(plan.dependencies.some(d => d.name === name), name)
      assert.ok(plan.commands.some(c => c.args.some(a => a.includes('@master/css-mcp'))))
      applyMasterCSSSetupPlan(plan, { install: false })
      const config = readFileSync(join(root, 'vite.config.js'), 'utf8')
      assert.match(config, /import masterCSS from '@master\/css-vite'/)
      assert.ok(config.includes(mode ? `masterCSS({ mode: '${mode}' })` : 'masterCSS()'))
      assert.match(readFileSync(join(root, 'src/style.css'), 'utf8'), /@import '@master\/css'/)
      assert.equal(readFileSync(join(root, 'src/main.js'), 'utf8'), "import './style.css'\n")
      assert.match(readFileSync(join(root, 'AGENTS.md'), 'utf8'), /Master CSS/)
      assert.match(readFileSync(join(root, 'eslint.config.js'), 'utf8'), /@master\/eslint-config-css/)
      mkdirSync(join(root, 'node_modules/@master'), { recursive: true })
      for (const name of ['css', 'css-vite', 'css-runtime']) symlinkSync(fileURLToPath(new URL(`node_modules/@master/${name}`, rootURL)), join(root, 'node_modules/@master', name), 'dir')
      symlinkSync(fileURLToPath(new URL('node_modules/vite', rootURL)), join(root, 'node_modules/vite'), 'dir')
      const authored = deliveryFences(installationSource('/vite')).find(fence => fence.name === 'src/main.js')!
      const command = deliveryFences(mode === 'runtime' ? installationDisclosure('/vite', 'Generate new classes in the browser') : installationSource('/vite')).find(fence => fence.text.includes('npm create @master/css@rc'))!.text.trim()
      assert.equal(command, `npm create @master/css@rc -- --framework vite${mode === 'runtime' ? ' --mode runtime' : ''} --yes`)
      assert.ok(authored, 'The Vite guide includes its complete application entry')
      writeFileSync(join(root, 'src/main.js'), authored.text)
      writeFileSync(join(root, 'index.html'), '<html><head><script type="module" src="/src/main.js"></script></head><body><div id="app"></div></body></html>')
      const built = spawnSync(process.execPath, [fileURLToPath(new URL('node_modules/vite/bin/vite.js', rootURL)), 'build'], { cwd: root, encoding: 'utf8', timeout: 30000 })
      assert.equal(built.status, 0, built.stderr)
      const assets = readdirSync(join(root, 'dist/assets'))
      const css = assets.filter(name => name.endsWith('.css')).map(name => readFileSync(join(root, 'dist/assets', name), 'utf8')).join('\n')
      if (mode !== 'runtime') {
        assert.match(css, /\.p-md\s*\{\s*padding:\s*var\(--spacing-md\)/)
        assert.ok(!assets.some(name => /\.wasm$|master-css-manifest|master-css-program/.test(name)))
      } else {
        assert.ok(assets.some(name => /master-css-program/.test(name)), assets.join(', '))
        assert.ok(!assets.some(name => name.endsWith('.wasm')), assets.join(', '))
      }

    } finally { rmSync(root, { recursive: true, force: true }) }
  }

  const root = mkdtempSync(join(tmpdir(), 'master-doc-install-cli-'))
  try {
    mkdirSync(join(root, 'node_modules/@master'), { recursive: true })
    symlinkSync(fileURLToPath(new URL('packages/css', rootURL)), join(root, 'node_modules/@master/css'), 'dir')
    writeFileSync(join(root, 'package.json'), JSON.stringify({ type: 'module', devDependencies: { '@master/css': 'rc', '@master/css-cli': 'rc' } }))
    const fences = deliveryFences(installationSection('', 'cli'))
    for (const name of ['main.css', 'index.html']) writeFileSync(join(root, name), fences.find(f => f.name === name)!.text)
    const command = fences.find(f => f.language === 'bash' && /generate/.test(f.text))!.text.trim()
    assert.equal(command, 'npx @master/css-cli generate "index.html" --output master.css --watch')
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('packages/cli/dist/bin/index.js', rootURL)), 'generate', 'index.html', '--output', 'master.css'], { cwd: root, encoding: 'utf8', timeout: 20000 })
    assert.equal(result.status, 0, result.stderr)
    const seen = new Set<string>()
    function readGraph(file: string): string {
      if (seen.has(file)) return ''
      seen.add(file)
      const css = readFileSync(join(root, file), 'utf8')
      return css + [...css.matchAll(/@import "\.\/([^"?#]+)"/g)].map(([, path]) => readGraph(decodeURIComponent(path))).join('\n')
    }
    const css = readGraph('master.css')
    for (const declaration of ['padding:var(--spacing-md)', 'border-width:calc(1 * 1px)', 'border-radius:var(--radius-md)', 'font-size:var(--text-sm)', 'font-weight:var(--font-weight-regular)']) assert.ok(css.includes(declaration), declaration)
    assert.doesNotMatch(css, /@compose|@master|@theme/)
  } finally { rmSync(root, { recursive: true, force: true }) }

  const settings = JSON.parse(deliveryFences(deliverySection('language-service', 'Set up VS Code \\{#set-up-vs-code\\}')).find(f => f.name === '.vscode/settings.json')!.text)
  assert.equal(settings['editor.quickSuggestions'].strings, true)
  const saveSettings = JSON.parse(deliveryFences(deliverySection('language-service', 'Add class sorting on save')).find(f => f.name === '.vscode/settings.json')!.text)
  assert.equal(saveSettings['editor.codeActionsOnSave']['source.fixAll.eslint'], 'explicit')
  assert.deepEqual(saveSettings['eslint.codeActionsOnSave.rules'], ['@master/css/sort-classes'])
  const cdn = installationSection('', 'cdn')
  assert.equal(deliveryFences(cdn).length, 0, 'Unavailable CDN delivery must not advertise a runnable installation')
  assert.match(cdn, /not available yet/)
  assert.match(cdn, /\[Integrations\]\(#integrations\)/)
  assert.match(cdn, /\[CLI\]\(#cli\)/)
}
