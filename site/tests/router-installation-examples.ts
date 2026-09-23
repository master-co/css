import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { planMasterCSSSetup, applyMasterCSSSetupPlan } from '../../packages/create/dist/index.js'
import { installationSource } from './installation-examples'
import { deliveryFences } from './delivery-examples'

const repository = fileURLToPath(new URL('../../', import.meta.url))
export const routerInstallationModes = ['runtime', 'static'] as const
export type RouterInstallationMode = typeof routerInstallationModes[number]
function dependency(name: string) {
  if (name === 'vite' || name.startsWith('@master/')) return realpathSync(join(repository, 'node_modules', name))
  const store = join(repository, 'node_modules/.pnpm')
  const entry = readdirSync(store).find(entry => entry.startsWith(name.replace('/', '+') + '@'))
  assert.ok(entry, `Missing installed dependency: ${name}`)
  return join(store, entry, 'node_modules', name)
}

/** @react-router/dev is not installed. The explicit fixture adapter supplies its
 * route/asset manifest and build entrypoints, then runs the real public
 * createRequestHandler, ServerRouter and HydratedRouter APIs. It does not replace
 * authored route modules, CSS compilation, runtime startup or SSR with fake HTML.
 * Framework CLI/config loading remains outside this test's coverage.
 */
export function routerInstallationFixture(mode: RouterInstallationMode) {
  mkdirSync(join(repository, 'tmp'), { recursive: true })
  const root = mkdtempSync(join(repository, 'tmp/master-router-doc-'))
  const dispose = () => rmSync(root, { recursive: true, force: true })
  const write = (name: string, text: string) => { mkdirSync(dirname(join(root, name)), { recursive: true }); writeFileSync(join(root, name), text) }
  try {
    write('package.json', JSON.stringify({ private: true, type: 'module', dependencies: { 'react-router': '7.18.3', react: '19.2.8', 'react-dom': '19.2.8' } }))
    write('vite.config.ts', "import { defineConfig } from 'vite'\nexport default defineConfig({ plugins: [] })\n")
    write('app/root.tsx', "import { Outlet } from 'react-router'\nexport default function App() { return <Outlet /> }\n")
    const plan = planMasterCSSSetup({ root, framework: 'react-router', mode: mode === 'static' ? mode : undefined, install: false })
    applyMasterCSSSetupPlan(plan, { install: false })
    assert.match(readFileSync(join(root, 'vite.config.ts'), 'utf8'), /@master\/css-vite/)
    assert.match(readFileSync(join(root, 'app/app.css'), 'utf8'), /@import '@master\/css'/)
    assert.match(readFileSync(join(root, 'app/root.tsx'), 'utf8'), /import '\.\/app.css'/)
    const route = '/react-router' + (mode === 'static' ? '/static-rendering' : '')
    const source = installationSource(route)
    const fences = deliveryFences(source)
    for (const name of ['vite.config.ts', 'app/app.css', 'app/root.tsx', 'app/routes/home.tsx', ...(mode === 'runtime' ? ['app/master-css.d.ts'] : [])]) {
      const found = fences.find(fence => fence.name === name)
      assert.ok(found, `${route}: ${name}`)
      const lines = found.text.trimEnd().split('\n')
      const indent = Math.min(...lines.filter(line => line.trim()).map(line => line.match(/^ */)![0].length))
      let text = lines.map(line => line.slice(indent)).join('\n') + '\n'
      if (name === 'vite.config.ts') {
        assert.match(text, /reactRouter\(\)/)
        // Only the unavailable framework compiler is replaced by the adapter below.
        text = text.replace("import { reactRouter } from '@react-router/dev/vite'\n", '').replace(', reactRouter()', '')
      }
      write(name, text)
    }
    assert.ok(source.includes(`npm create @master/css@rc -- --framework react-router${mode === 'static' ? ' --mode static' : ''} --yes`))
    write('tsconfig.json', JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'ESNext', jsx: 'react-jsx' } }))
    for (const name of ['vite', 'react', 'react-dom', 'react-router', '@master/css', '@master/css-vite', '@master/css-runtime']) {
      const destination = join(root, 'node_modules', name)
      mkdirSync(dirname(destination), { recursive: true })
      symlinkSync(dependency(name), destination, 'dir')
    }
    write('app/entry.client.tsx', "import { hydrateRoot } from 'react-dom/client'\nimport { HydratedRouter } from 'react-router/dom'\nhydrateRoot(document, <HydratedRouter />)\n")
    write('build-fixture.mjs', `import { build } from 'vite'
import { readFileSync, writeFileSync } from 'node:fs'
import config from './vite.config.ts'
await build({ ...config, configFile: false, build: { outDir: 'dist/client', manifest: true, rollupOptions: { input: { entry: 'app/entry.client.tsx', root: 'app/root.tsx', home: 'app/routes/home.tsx' }, preserveEntrySignatures: 'strict' } } })
const manifest = JSON.parse(readFileSync('dist/client/.vite/manifest.json', 'utf8'))
const file = name => '/' + manifest[name].file
const imports = name => (manifest[name].imports ?? []).map(key => '/' + manifest[key].file)
const css = name => [...new Set([...(manifest[name].css ?? []), ...(manifest[name].imports ?? []).flatMap(key => css(key))])]
const route = (id, source, extra) => ({ id, module: file(source), imports: imports(source), css: css(source).map(file => '/' + file), hasAction: false, hasLoader: false, hasClientAction: false, hasClientLoader: false, hasClientMiddleware: false, hasErrorBoundary: false, ...extra })
const assets = { entry: { module: file('app/entry.client.tsx'), imports: imports('app/entry.client.tsx') }, routes: { root: route('root', 'app/root.tsx', { path: '' }), home: route('home', 'app/routes/home.tsx', { parentId: 'root', index: true }) }, url: '/manifest.js', version: 'fixture' }
writeFileSync('assets-manifest.json', JSON.stringify(assets))
writeFileSync('dist/client/manifest.js', 'window.__reactRouterManifest=' + JSON.stringify(assets))
await build({ ...config, configFile: false, build: { ssr: 'entry.server.tsx', outDir: 'dist/server', emitAssets: true, rollupOptions: { output: { entryFileNames: 'entry.js' } } } })
`)
    write('entry.server.tsx', `import { createRequestHandler, ServerRouter } from 'react-router'
import { renderToReadableStream } from 'react-dom/server'
import * as root from './app/root'
import * as home from './app/routes/home'
import assets from './assets-manifest.json'
export const handler = createRequestHandler({
  entry: { module: { default: async (request, status, headers, context) => {
    const body = await renderToReadableStream(<ServerRouter context={context} url={request.url} />)
    await body.allReady
    headers.set('Content-Type', 'text/html; charset=utf-8')
    return new Response(body, { status, headers })
  } } },
  routes: { root: { id: 'root', path: '', module: root }, home: { id: 'home', parentId: 'root', index: true, module: home } },
  assets, publicPath: '/', assetsBuildDirectory: 'dist/client', future: {}, ssr: true, isSpaMode: false, prerender: [], routeDiscovery: { mode: 'initial', manifestPath: '/__manifest' },
}, 'production')
`)
    const built = spawnSync(process.execPath, ['build-fixture.mjs'], { cwd: root, encoding: 'utf8', timeout: 60000, env: { ...process.env, NODE_ENV: 'production' } })
    assert.equal(built.status, 0, `${mode}: ${built.stderr}\n${built.stdout}`)
    const assets = readdirSync(join(root, 'dist/client'), { recursive: true }).filter((file): file is string => typeof file === 'string')
    const css = assets.filter(name => name.endsWith('.css')).map(name => readFileSync(join(root, 'dist/client', name), 'utf8')).join('\n')
    if (mode === 'static') {
      assert.match(css, /font-style:\s?italic/)
      assert.ok(!assets.some(name => name.endsWith('.wasm')))
    } else {
      assert.doesNotMatch(css, /font-style:\s?italic/)
      assert.ok(assets.some(name => name.endsWith('.wasm')))
    }
    write('server.mjs', `import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, extname } from 'node:path'
import { Readable } from 'node:stream'
import { handler } from './dist/server/entry.js'
const publicRoot = resolve('dist/client')
const types = { '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm' }
createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://' + request.headers.host)
    if (url.pathname === '/favicon.ico') { response.writeHead(204).end(); return }
    const file = resolve(publicRoot, '.' + url.pathname)
    if (file.startsWith(publicRoot + '/') && existsSync(file)) {
      response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' })
      response.end(readFileSync(file)); return
    }
    const result = await handler(new Request(url))
    response.writeHead(result.status, Object.fromEntries(result.headers))
    if (result.body) Readable.fromWeb(result.body).pipe(response)
    else response.end()
  } catch (error) { console.error(error); response.writeHead(500).end(String(error)) }
}).listen(Number(process.env.ROUTER_PORT), '127.0.0.1')
`)
    return { root, bin: join(root, 'server.mjs'), dispose }
  } catch (error) { dispose(); throw error }
}

export function verifyRouterInstallationExamples() {
  for (const mode of routerInstallationModes) routerInstallationFixture(mode).dispose()
}
