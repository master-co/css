import assert from 'node:assert/strict'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import { planMasterCSSSetup, applyMasterCSSSetupPlan } from '../../packages/create/dist/index.js'
import { installationSource } from './installation-examples'
import { deliveryFences } from './delivery-examples'

const repository = fileURLToPath(new URL('../../', import.meta.url))
export const islandsInstallationRoutes = ['/astro', '/astro/runtime-rendering', '/astro/static-rendering', '/svelte'] as const
function dependency(name: string) {
  const store = join(repository, 'node_modules/.pnpm')
  if (name === 'typescript') return join(store, 'typescript@6.0.3/node_modules/typescript')
  const match = readdirSync(store).filter(value => value.startsWith(name.replace('/', '+') + '@')).sort().at(-1)
  assert.ok(match, `Existing workspace dependency required: ${name}`)
  return join(store, match, 'node_modules', name)
}
function unindent(source: string) {
  const lines = source.trimEnd().split('\n')
  const indent = Math.min(...lines.filter(line => line.trim()).map(line => line.match(/^ */)![0].length))
  return lines.map(line => line.slice(indent)).join('\n') + '\n'
}

/** Builds authored pages and configuration against the installed framework versions. */
export async function islandsInstallationFixture(route: typeof islandsInstallationRoutes[number]) {
  const root = mkdtempSync(join(tmpdir(), 'master-islands-install-'))
  const isSvelte = route === '/svelte'
  const mode = route.endsWith('runtime-rendering') ? 'runtime' : route.endsWith('static-rendering') ? 'static' : 'progressive'
  const dispose = () => rmSync(root, { recursive: true, force: true })
  const write = (name: string, text: string) => { mkdirSync(dirname(join(root, name)), { recursive: true }); writeFileSync(join(root, name), text) }
  const source = installationSource(route)
  const fences = deliveryFences(source)
  const file = (name: string) => {
    const fence = fences.find(fence => decodeURIComponent(fence.name ?? '') === name)
    assert.ok(fence, `${route}: missing ${name}`)
    return unindent(fence.text)
  }
  try {
    const packages = isSvelte ? ['@sveltejs/kit', '@sveltejs/vite-plugin-svelte', 'svelte', 'vite', 'svelte-check', 'typescript'] : ['astro', 'vite']
    if (isSvelte) {
      const { create, add } = await import(pathToFileURL(join(dependency('sv'), 'dist/src/index.mjs')).href)
      const { default: addon } = await import('../../packages/css-sv/dist/index.js')
      create({ cwd: root, name: 'docs-installation', template: 'minimal', types: 'typescript' })
      await add({ cwd: root, addons: { 'master-css': addon }, options: { 'master-css': {} }, packageManager: 'npm' })
      assert.match(readFileSync(join(root, 'vite.config.ts'), 'utf8'), /@master\/css-svelte\/vite/)
      assert.match(readFileSync(join(root, 'src/routes/+layout.svelte'), 'utf8'), /import ['"]\.\/layout.css['"]/)
      assert.match(readFileSync(join(root, 'src/hooks.server.ts'), 'utf8'), /@master\/css-svelte\/hooks.server/)
      // Use a local prerender adapter so the production HTML can be checked without a host.
      write('svelte.config.js', `export default { kit: { adapter: { name: 'fixture', async adapt(builder) { builder.writeClient('dist'); builder.writePrerendered('dist') } } } }\n`)
      write('src/routes/+page.ts', 'export const prerender = true\n')
      for (const name of ['vite.config.ts', 'src/routes/layout.css', 'src/routes/+layout.svelte', 'src/hooks.server.ts', 'src/routes/+page.svelte', 'src/master-css.d.ts']) write(name, file(name))
      assert.match(source, /npx sv create my-app --template minimal --types ts --no-add-ons --install npm/)
      assert.match(source, /npx sv add @master\/css-svelte-addon/)
    } else {
      write('package.json', JSON.stringify({ type: 'module', dependencies: { astro: '*' }, scripts: { build: 'astro build', preview: 'astro preview', dev: 'astro dev' } }))
      if (mode === 'static') {
        write('astro.config.mjs', "import { defineConfig } from 'astro/config'\nexport default defineConfig({})\n")
        assert.match(source, /npm install -D @master\/css@rc @master\/css-cli@rc/)
      } else {
        const plan = planMasterCSSSetup({ root, framework: 'astro', mode: mode === 'progressive' ? undefined : mode, install: false, yes: true })
        applyMasterCSSSetupPlan(plan, { install: false })
        assert.match(readFileSync(join(root, 'astro.config.mjs'), 'utf8'), /@master\/css-astro/)
        write('astro.config.mjs', file('astro.config.mjs'))
        const command = fences.find(fence => fence.text.includes('npm create @master/css@rc'))!.text.trim()
        assert.equal(command, `npm create @master/css@rc -- --framework astro${mode === 'progressive' ? '' : ' --mode ' + mode} --yes`)
      }
      for (const name of ['src/styles/global.css', 'src/pages/index.astro']) write(name, file(name))
    }
    for (const name of [...packages, '@master/css', isSvelte ? '@master/css-svelte' : '@master/css-astro', '@master/css-runtime', '@master/css-server']) {
      const destination = join(root, 'node_modules', name)
      mkdirSync(dirname(destination), { recursive: true })
      if (name === 'svelte-check') {
        // Relocate the checker to resolve the existing TS 6 runtime supported by it.
        cpSync(dependency(name), destination, { recursive: true })
        const checker = JSON.parse(readFileSync(join(destination, 'package.json'), 'utf8'))
        for (const required of Object.keys(checker.dependencies)) {
          const target = join(root, 'node_modules', required)
          mkdirSync(dirname(target), { recursive: true })
          symlinkSync(dependency(required), target, 'dir')
        }
        continue
      }
      symlinkSync(name.startsWith('@master/') ? join(repository, 'node_modules', name) : dependency(name), destination, 'dir')
    }
    if (mode === 'static') {
      const command = 'npx @master/css-cli generate --output public/master.css'
      assert.ok(source.includes(command + '\n'))
      const generated = spawnSync(process.execPath, [join(repository, 'packages/cli/dist/bin/index.js'), ...command.split(' ').slice(2)], { cwd: root, encoding: 'utf8', timeout: 30000 })
      assert.equal(generated.status, 0, generated.stderr)
    }
    const buildPackage = dependency(isSvelte ? 'vite' : 'astro')
    const pkg = JSON.parse(readFileSync(join(buildPackage, 'package.json'), 'utf8'))
    const bin = typeof pkg.bin === 'string' ? pkg.bin : Object.values(pkg.bin)[0] as string
    const entry = join(buildPackage, bin)
    const built = spawnSync(process.execPath, [entry, 'build'], { cwd: root, encoding: 'utf8', timeout: 90000, env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' } })
    assert.equal(built.status, 0, `${route}: ${built.stderr}\n${built.stdout}`)
    if (isSvelte) {
      const checked = spawnSync(process.execPath, [join(root, 'node_modules/svelte-check/bin/svelte-check'), '--tsconfig', './tsconfig.json'], { cwd: root, encoding: 'utf8', timeout: 30000 })
      assert.equal(checked.status, 0, checked.stderr + checked.stdout)
    }
    const assets = readdirSync(join(root, 'dist'), { recursive: true }).filter((file): file is string => typeof file === 'string')
    const html = readFileSync(join(root, 'dist/index.html'), 'utf8')
    assert.match(html, /Hello World/)
    if (mode !== 'runtime') {
      const css = assets.filter(name => name.endsWith('.css')).map(name => readFileSync(join(root, 'dist', name), 'utf8')).join('\n')
      assert.match(html + css, /font-style:\s?italic/, route)
    }
    if (mode === 'static') assert.ok(!assets.some(file => /\.wasm$|master-css-runtime|master-css-manifest/.test(file)), 'Static builds must not ship runtime assets')
    else assert.ok(assets.some(file => file.endsWith('.wasm')), 'Runtime Wasm is emitted')
    return { root: join(root, 'dist'), dispose }
  } catch (error) { dispose(); throw error }
}
export async function verifyIslandsInstallationExamples() {
  for (const route of islandsInstallationRoutes) (await islandsInstallationFixture(route)).dispose()
}
