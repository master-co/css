import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { planMasterCSSSetup, applyMasterCSSSetupPlan } from '../../packages/create/dist/index.js'
import { installationSource } from './installation-examples'
import { deliveryFences } from './delivery-examples'

const repository = fileURLToPath(new URL('../../', import.meta.url))
export const themeInstallationRoutes = ['/laravel', '/wordpress', '/wordpress/static-rendering', '/shopify'] as const
function dependency(name: string) {
  if (name.startsWith('@master/')) return join(repository, 'node_modules', name)
  const store = join(repository, 'node_modules/.pnpm')
  const match = readdirSync(store).filter(value => value.startsWith(name + '@')).sort().at(-1)
  assert.ok(match, `Existing dependency required: ${name}`)
  return join(store, match, 'node_modules', name)
}

/** Actual asset builds. PHP records WordPress hooks through explicit stubs;
 * Blade and Liquid host tags are adapted, not executed as full applications.
 */
export function themeInstallationFixture(route: typeof themeInstallationRoutes[number]) {
  const root = mkdtempSync(join(tmpdir(), 'master-theme-install-'))
  const source = installationSource(route)
  const fences = deliveryFences(source)
  const dispose = () => rmSync(root, { recursive: true, force: true })
  const write = (name: string, text: string) => { mkdirSync(dirname(join(root, name)), { recursive: true }); writeFileSync(join(root, name), text) }
  const file = (name: string) => {
    const fence = fences.find(fence => decodeURIComponent(fence.name ?? '') === name)
    assert.ok(fence, `${route}: missing ${name}`)
    const lines = fence.text.trimEnd().split('\n')
    const indent = Math.min(...lines.filter(line => line.trim()).map(line => line.match(/^ */)![0].length))
    return lines.map(line => line.slice(indent)).join('\n') + '\n'
  }
  try {
    const laravel = route === '/laravel'
    const shopify = route === '/shopify'
    const runtime = route === '/wordpress'
    const entry = laravel ? 'resources/css/app.css' : (shopify ? 'src' : 'resources') + '/master.ts'
    if (laravel) {
      write('package.json', JSON.stringify({ type: 'module', devDependencies: { vite: '*', 'laravel-vite-plugin': '*' }, scripts: { dev: 'vite', build: 'vite build' } }))
      write('vite.config.js', "import { defineConfig } from 'vite'\nimport laravel from 'laravel-vite-plugin'\nexport default defineConfig({ plugins: [laravel({ input: ['resources/css/app.css'], refresh: true })] })\n")
      const plan = planMasterCSSSetup({ root, framework: 'laravel', mode: 'static', install: false, yes: true })
      applyMasterCSSSetupPlan(plan, { install: false })
      assert.match(readFileSync(join(root, 'vite.config.js'), 'utf8'), /@master\/css-vite/)
      assert.match(source, /npm create @master\/css@rc -- --framework laravel --mode static --yes/)
      for (const name of ['vite.config.js', entry, 'resources/views/app.blade.php', 'routes/web.php']) write(name, file(name))
      const checked = spawnSync('php', ['-l', 'routes/web.php'], { cwd: root, encoding: 'utf8' })
      assert.equal(checked.status, 0, checked.stderr)
    } else {
      for (const name of ['package.json', 'vite.config.ts', entry, entry.replace('.ts', '.css')]) write(name, file(name))
      const scripts = JSON.parse(file('package.json')).scripts
      assert.equal(scripts['build:assets'], 'vite build')
      assert.equal(scripts['watch:assets'], 'vite build --watch')
      const templates = shopify ? ['sections/main-page.liquid', 'layout/theme.liquid'] : ['functions.php', 'index.php']
      for (const name of templates) write(name, file(name))
      write('assets/existing-theme.css', 'body { color: inherit }')
    }
    for (const name of ['vite', '@master/css', '@master/css-vite', '@master/css-runtime', ...(laravel ? ['laravel-vite-plugin'] : [])]) {
      const destination = join(root, 'node_modules', name)
      mkdirSync(dirname(destination), { recursive: true })
      symlinkSync(dependency(name), destination, 'dir')
    }
    const built = spawnSync(process.execPath, [join(dependency('vite'), 'bin/vite.js'), 'build'], { cwd: root, encoding: 'utf8', timeout: 60000 })
    assert.equal(built.status, 0, `${route}: ${built.stderr}\n${built.stdout}`)
    if (!laravel) assert.equal(readFileSync(join(root, 'assets/existing-theme.css'), 'utf8'), 'body { color: inherit }')
    const output = laravel ? join(root, 'public/build') : join(root, shopify ? 'assets' : 'assets/master-css')
    const assets = readdirSync(output, { recursive: true }) as string[]
    const css = assets.filter(name => name.endsWith('.css')).map(name => readFileSync(join(output, name), 'utf8')).join('\n')
    if (!runtime) {
      assert.match(css, /font-style:italic/, route)
      assert.ok(!assets.some(name => /\.wasm$|master-css-manifest/.test(name)))
    } else assert.ok(assets.some(name => name.endsWith('.wasm')))
    let html: string
    if (laravel) {
      const manifest = JSON.parse(readFileSync(join(output, 'manifest.json'), 'utf8'))
      const href = '/build/' + manifest[entry].file
      assert.match(href, /\.css$/)
      const template = file('resources/views/app.blade.php')
      assert.equal(template.match(/@vite\('resources\/css\/app.css'\)/g)?.length, 1)
      html = template.replace("@vite('resources/css/app.css')", `<link rel="stylesheet" href="${href}">`)
    } else if (shopify) {
      assert.equal(file('layout/theme.liquid').trim(), "{{ 'master.css' | asset_url | stylesheet_tag }}")
      html = `<!doctype html><html><head><link rel="stylesheet" href="https://theme-cdn.test/assets/master.css?v=1"></head><body>${file('sections/main-page.liquid')}</body></html>`
    } else {
      // Native PHP executes the authored hook. Stubs record the exact arguments;
      // they do not claim to exercise WordPress's full enqueue implementation.
      write('enqueue-check.php', `<?php
$styles = []; $modules = [];
function get_stylesheet_directory() { return __DIR__; }
function get_stylesheet_directory_uri() { return 'https://theme-cdn.test/wp-content/themes/child'; }
function add_action($hook, $callback) { if ($hook !== 'wp_enqueue_scripts') throw new Exception($hook); $callback(); }
function wp_enqueue_style(...$arguments) { global $styles; $styles[] = $arguments; }
function wp_enqueue_script_module(...$arguments) { global $modules; $modules[] = $arguments; }
require 'functions.php';
echo json_encode([$styles, $modules]);
`)
      const checked = spawnSync('php', ['enqueue-check.php'], { cwd: root, encoding: 'utf8' })
      assert.equal(checked.status, 0, checked.stderr)
      assert.equal(checked.stderr, '')
      const [styles, modules] = JSON.parse(checked.stdout) as [unknown[][], unknown[][]]
      assert.equal(styles.length, 1)
      assert.equal(styles[0][0], 'master-css')
      assert.equal(styles[0][1], 'https://theme-cdn.test/wp-content/themes/child/assets/master-css/master.css')
      assert.match(String(styles[0][3]), /^\d+$/)
      assert.deepEqual(styles[0][2], [])
      assert.equal(modules.length, runtime ? 1 : 0)
      if (runtime) {
        assert.equal(modules[0][1], 'https://theme-cdn.test/wp-content/themes/child/assets/master-css/master.js')
        assert.match(String(modules[0][3]), /^\d+$/)
        assert.doesNotMatch(file('header.php'), /\bhidden\b/)
      }
      write('render-check.php', `<?php
function get_header() {} function get_footer() {}
require 'index.php';
`)
      const rendered = spawnSync('php', ['render-check.php'], { cwd: root, encoding: 'utf8' })
      assert.equal(rendered.status, 0, rendered.stderr)
      const tags = `<link rel="stylesheet" href="${styles[0][1]}?ver=${styles[0][3]}">` + (runtime ? `<script type="module" src="${modules[0][1]}?ver=${modules[0][3]}"></script>` : '')
      html = `<!doctype html><html><head>${tags}</head><body>${rendered.stdout}</body></html>`
    }
    return { root: laravel ? join(root, 'public') : root, html, runtime, dispose }
  } catch (error) { dispose(); throw error }
}
export function verifyThemeInstallationExamples() {
  for (const route of themeInstallationRoutes) themeInstallationFixture(route).dispose()
}
