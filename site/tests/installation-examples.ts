import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { planMasterCSSSetup, applyMasterCSSSetupPlan } from '../../packages/create/dist/index.js'
import { deliveryFences } from './delivery-examples'

const rootURL = new URL('../../', import.meta.url)
const installation = new URL('../app/[locale]/guide/installation/', import.meta.url)
export const installationRoutes = ['', '/integrations', '/cli', '/cdn', '/vite', '/vite/static-rendering', '/vscode', '/react', '/react/static-rendering', '/vuejs', '/vuejs/static-rendering', '/lit', '/webpack', '/webpack/static-rendering', '/rspack', '/rspack/static-rendering', '/rsbuild', '/rsbuild/static-rendering', '/astro', '/astro/runtime-rendering', '/astro/static-rendering', '/svelte', '/express', '/express/static-rendering', '/php', '/php/static-rendering', '/rails', '/rails/static-rendering', '/laravel', '/wordpress', '/wordpress/static-rendering', '/shopify', '/aspnet-core', '/aspnet-core/static-rendering', '/blazor', '/blazor/runtime-rendering', '/blazor/static-rendering', '/storybook', '/angular', '/angular/runtime-rendering', '/angular/static-rendering', '/nextjs', '/nextjs/runtime-rendering', '/nextjs/static-rendering', '/nuxtjs', '/nuxtjs/runtime-rendering', '/nuxtjs/static-rendering', '/react-router', '/react-router/static-rendering', '/tanstack-start', '/tanstack-start/static-rendering']
export function installationSource(route: string) {
  const path = ['', '/integrations', '/cli', '/cdn'].includes(route) ? `(main)${route}/content.mdx` : `${route.slice(1)}/content.mdx`
  return readFileSync(new URL(path, installation), 'utf8')
}

export function verifyInstallationExamples() {
  const ledger = JSON.parse(readFileSync(new URL('./docs-refinement.json', import.meta.url), 'utf8')) as { pages: { url: string }[] }
  const routes = new Set([...ledger.pages.map(page => page.url), '/play'])
  for (const route of installationRoutes) {
    for (const match of installationSource(route).matchAll(/\]\((\/[^)]+)\)|href: ['"](\/[^'"]+)['"]/g)) {
      const href = (match[1] ?? match[2]).split('#')[0]
      assert.ok(routes.has(href), `${route}: missing destination ${href}`)
    }
  }
  for (const mode of [undefined, 'static'] as const) {
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
      assert.ok(config.includes(mode ? "masterCSS({ mode: 'static' })" : 'masterCSS()'))
      assert.match(readFileSync(join(root, 'src/style.css'), 'utf8'), /@import '@master\/css'/)
      assert.equal(readFileSync(join(root, 'src/main.js'), 'utf8'), "import './style.css'\n")
      assert.match(readFileSync(join(root, 'AGENTS.md'), 'utf8'), /Master CSS/)
      assert.match(readFileSync(join(root, 'eslint.config.js'), 'utf8'), /@master\/eslint-config-css/)
      mkdirSync(join(root, 'node_modules/@master'), { recursive: true })
      for (const name of ['css', 'css-vite', 'css-runtime']) symlinkSync(fileURLToPath(new URL(`node_modules/@master/${name}`, rootURL)), join(root, 'node_modules/@master', name), 'dir')
      symlinkSync(fileURLToPath(new URL('node_modules/vite', rootURL)), join(root, 'node_modules/vite'), 'dir')
      writeFileSync(join(root, 'index.html'), '<html><head><script type="module" src="/src/main.js"></script></head><body><h1 class="m:md italic font:3xl font:heavy text:strong">Hello World</h1></body></html>')
      const built = spawnSync(process.execPath, [fileURLToPath(new URL('node_modules/vite/bin/vite.js', rootURL)), 'build'], { cwd: root, encoding: 'utf8', timeout: 30000 })
      assert.equal(built.status, 0, built.stderr)
      const assets = readdirSync(join(root, 'dist/assets'))
      const css = assets.filter(name => name.endsWith('.css')).map(name => readFileSync(join(root, 'dist/assets', name), 'utf8')).join('\n')
      if (mode === 'static') {
        assert.match(css, /font-style:italic/)
        assert.ok(!assets.some(name => /\.wasm$|master-css-manifest/.test(name)))
      } else {
        assert.ok(assets.some(name => /master-css-manifest/.test(name)), assets.join(', '))
        assert.ok(assets.some(name => name.endsWith('.wasm')), assets.join(', '))
      }

    } finally { rmSync(root, { recursive: true, force: true }) }
  }

  const root = mkdtempSync(join(tmpdir(), 'master-doc-install-cli-'))
  try {
    mkdirSync(join(root, 'node_modules/@master'), { recursive: true })
    symlinkSync(fileURLToPath(new URL('packages/css', rootURL)), join(root, 'node_modules/@master/css'), 'dir')
    writeFileSync(join(root, 'package.json'), JSON.stringify({ type: 'module', devDependencies: { '@master/css': 'rc', '@master/css-cli': 'rc' } }))
    const fences = deliveryFences(installationSource('/cli'))
    for (const name of ['main.css', 'index.html']) writeFileSync(join(root, name), fences.find(f => f.name === name)!.text)
    const command = fences.find(f => f.language === 'bash' && /generate/.test(f.text) && !/--watch/.test(f.text))!.text.trim()
    assert.equal(command, 'npx @master/css-cli generate --output master.css')
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('packages/cli/dist/bin/index.js', rootURL)), ...command.split(' ').slice(2)], { cwd: root, encoding: 'utf8', timeout: 20000 })
    assert.equal(result.status, 0, result.stderr)
    const seen = new Set<string>()
    function readGraph(file: string): string {
      if (seen.has(file)) return ''
      seen.add(file)
      const css = readFileSync(join(root, file), 'utf8')
      return css + [...css.matchAll(/@import "\.\/([^"?#]+)"/g)].map(([, path]) => readGraph(decodeURIComponent(path))).join('\n')
    }
    const css = readGraph('master.css')
    for (const declaration of ['font-style:italic', 'font-size:var(--font-size-3xl)', 'font-weight:var(--font-weight-heavy)', 'margin:var(--spacing-md)']) assert.ok(css.includes(declaration), declaration)
    assert.doesNotMatch(css, /@compose|@master|@theme/)
  } finally { rmSync(root, { recursive: true, force: true }) }

  const settings = deliveryFences(installationSource('/vscode')).filter(f => f.name === '.vscode/settings.json').map(f => JSON.parse(f.text)).at(-1)
  assert.equal(settings['editor.codeActionsOnSave']['source.fixAll.eslint'], 'explicit')
  assert.deepEqual(settings['eslint.codeActionsOnSave.rules'], ['@master/css/sort-classes'])
  const cdn = deliveryFences(installationSource('/cdn')).find(f => f.name === 'index.html')!.text
  assert.doesNotMatch(cdn, /<html[^>]*\bhidden\b/)
  assert.match(cdn, /<script defer src="https:\/\/cdn.master.co\/css-runtime@rc"><\/script>/)
  assert.match(cdn, /<link rel="stylesheet" href="https:\/\/cdn.master.co\/css@rc\/base.css">/)
}
