import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { planMasterCSSSetup, applyMasterCSSSetupPlan } from '../../packages/create/dist/index.js'
import { installationSource } from './installation-examples'
import { deliveryFences } from './delivery-examples'

const repository = fileURLToPath(new URL('../../', import.meta.url))
export const tanstackInstallationModes = ['runtime', 'static'] as const
export type TanstackInstallationMode = typeof tanstackInstallationModes[number]
function dependency(name: string) {
  if (name === 'vite' || name.startsWith('@master/')) return realpathSync(join(repository, 'node_modules', name))
  const store = join(repository, 'node_modules/.pnpm')
  const entry = readdirSync(store).find(entry => entry.startsWith(name.replace('/', '+') + '@'))
  assert.ok(entry, `Missing installed dependency: ${name}`)
  return join(store, entry, 'node_modules', name)
}

/** Builds the literal authored Vite/root/route source with the installed TanStack
 * Start compiler. The local Node adapter serves its fetch entry and client assets;
 * provider-specific deployment plugins and CLI scaffolding are not exercised.
 */
export function tanstackInstallationFixture(mode: TanstackInstallationMode) {
  mkdirSync(join(repository, 'tmp'), { recursive: true })
  const root = mkdtempSync(join(repository, 'tmp/master-tanstack-doc-'))
  const dispose = () => rmSync(root, { recursive: true, force: true })
  const write = (name: string, text: string) => { mkdirSync(dirname(join(root, name)), { recursive: true }); writeFileSync(join(root, name), text) }
  try {
    write('package.json', JSON.stringify({ private: true, type: 'module', dependencies: { '@tanstack/react-start': '1.168.50', '@tanstack/react-router': '1.170.33', react: '19.2.8', 'react-dom': '19.2.8' } }))
    write('vite.config.ts', "import { defineConfig } from 'vite'\nexport default defineConfig({ plugins: [] })\n")
    write('src/routes/__root.tsx', "import { Outlet } from '@tanstack/react-router'\nexport default function App() { return <Outlet /> }\n")
    const plan = planMasterCSSSetup({ root, framework: 'tanstack-start', mode: mode === 'static' ? mode : undefined, install: false })
    applyMasterCSSSetupPlan(plan, { install: false })
    assert.match(readFileSync(join(root, 'vite.config.ts'), 'utf8'), /@master\/css-vite/)
    assert.match(readFileSync(join(root, 'src/styles/app.css'), 'utf8'), /@import '@master\/css'/)
    assert.match(readFileSync(join(root, 'src/routes/__root.tsx'), 'utf8'), /import '\.\.\/styles\/app.css'/)
    const route = '/tanstack-start' + (mode === 'static' ? '/static-rendering' : '')
    const source = installationSource(route)
    const fences = deliveryFences(source)
    for (const name of ['vite.config.ts', 'src/styles/app.css', 'src/routes/__root.tsx', 'src/routes/index.tsx', ...(mode === 'runtime' ? ['src/master-css.d.ts'] : [])]) {
      const found = fences.find(fence => fence.name === name)
      assert.ok(found, `${route}: ${name}`)
      const lines = found.text.trimEnd().split('\n')
      const indent = Math.min(...lines.filter(line => line.trim()).map(line => line.match(/^ */)![0].length))
      const text = lines.map(line => line.slice(indent)).join('\n') + '\n'
      write(name, text)
    }
    assert.ok(source.includes(`npm create @master/css@rc -- --framework tanstack-start${mode === 'static' ? ' --mode static' : ''} --yes`))
    write('tsconfig.json', JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'ESNext', jsx: 'react-jsx' } }))
    for (const name of ['vite', 'react', 'react-dom', '@tanstack/react-start', '@tanstack/react-router', '@vitejs/plugin-react', '@master/css', '@master/css-vite', '@master/css-runtime']) {
      const destination = join(root, 'node_modules', name)
      mkdirSync(dirname(destination), { recursive: true })
      symlinkSync(dependency(name), destination, 'dir')
    }
    write('src/router.tsx', `import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
export function getRouter() { return createRouter({ routeTree, scrollRestoration: true }) }
declare module '@tanstack/react-router' { interface Register { router: ReturnType<typeof getRouter> } }
`)
    const built = spawnSync(process.execPath, [join(dependency('vite'), 'bin/vite.js'), 'build'], { cwd: root, encoding: 'utf8', timeout: 90000, env: { ...process.env, NODE_ENV: 'production' } })
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
import entry from './dist/server/server.js'
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
    const result = await entry.fetch(new Request(url))
    response.writeHead(result.status, Object.fromEntries(result.headers))
    if (result.body) Readable.fromWeb(result.body).pipe(response)
    else response.end()
  } catch (error) { console.error(error); response.writeHead(500).end(String(error)) }
}).listen(Number(process.env.TANSTACK_PORT), '127.0.0.1')
`)
    return { root, bin: join(root, 'server.mjs'), dispose }
  } catch (error) { dispose(); throw error }
}

export function verifyTanstackInstallationExamples() {
  for (const mode of tanstackInstallationModes) tanstackInstallationFixture(mode).dispose()
}
