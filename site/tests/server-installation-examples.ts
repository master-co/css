import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { createServer } from 'node:net'
import { installationSource } from './installation-examples'
import { deliveryFences } from './delivery-examples'

const repository = fileURLToPath(new URL('../../', import.meta.url))
export const serverInstallationRoutes = ['/express', '/express/static-rendering', '/php', '/php/static-rendering', '/rails', '/rails/static-rendering'] as const
function dependency(name: string) {
  if (name.startsWith('@master/')) return join(repository, 'node_modules', name)
  const store = join(repository, 'node_modules/.pnpm')
  const match = readdirSync(store).filter(value => value.startsWith(name + '@')).sort().at(-1)
  assert.ok(match, `Existing dependency required: ${name}`)
  return join(store, match, 'node_modules', name)
}
async function unusedPort() {
  const server = createServer()
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  assert.ok(address && typeof address !== 'string')
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  return address.port
}

/** Actual Vite assets, native Express/PHP responses and Ruby ERB rendering.
 * Rails itself is not installed: its security/importmap helpers are host stubs.
 * The browser fixture checks the compiled assets, not Rails or Turbo lifecycle.
 */
export async function serverInstallationFixture(route: typeof serverInstallationRoutes[number]) {
  const root = mkdtempSync(join(tmpdir(), 'master-server-install-'))
  const host = route.split('/')[1]
  const isStatic = route.endsWith('/static-rendering')
  const source = installationSource(route)
  const fences = deliveryFences(source)
  let child: ChildProcess | undefined
  let errors = ''
  const dispose = async () => {
    if (child && child.exitCode === null) {
      const exited = new Promise<void>(resolve => child!.once('exit', () => resolve()))
      child.kill('SIGTERM')
      await exited
    }
    rmSync(root, { recursive: true, force: true })
  }
  const write = (name: string, text: string) => { mkdirSync(dirname(join(root, name)), { recursive: true }); writeFileSync(join(root, name), text) }
  const file = (name: string) => {
    const fence = fences.find(fence => decodeURIComponent(fence.name ?? '') === name)
    assert.ok(fence, `${route}: missing ${name}`)
    const lines = fence.text.trimEnd().split('\n')
    const indent = Math.min(...lines.filter(line => line.trim()).map(line => line.match(/^ */)![0].length))
    return lines.map(line => line.slice(indent)).join('\n') + '\n'
  }
  try {
    const entry = { express: 'src', php: 'resources', rails: 'app/frontend' }[host]!
    const authored = ['vite.config.ts', 'package.json', `${entry}/main.ts`, `${entry}/app.css`]
    if (host === 'express') authored.push('app.mjs', 'views/index.html')
    if (host === 'php') authored.push('public/index.php', 'app/views/home.php')
    if (host === 'rails') authored.push('app/views/layouts/application.html.erb', 'app/views/home/index.html.erb', 'config/routes.rb')
    for (const name of authored) write(name, file(name))
    write('public/assets/keep.txt', 'existing host assets')
    for (const name of ['vite', '@master/css', '@master/css-vite', '@master/css-runtime', '@master/css-server', '@master/css-preset', ...(host === 'express' ? ['express'] : [])]) {
      const destination = join(root, 'node_modules', name)
      mkdirSync(dirname(destination), { recursive: true })
      symlinkSync(dependency(name), destination, 'dir')
    }
    const scripts = JSON.parse(file('package.json')).scripts
    assert.equal(scripts['build:assets'], 'vite build')
    assert.equal(scripts['watch:assets'], 'vite build --watch')
    assert.match(source, /npm run build:assets/)
    assert.match(source, /@master\/css@rc/)
    const built = spawnSync(process.execPath, [join(dependency('vite'), 'bin/vite.js'), 'build'], { cwd: root, encoding: 'utf8', timeout: 60000 })
    assert.equal(built.status, 0, `${route}: ${built.stderr}\n${built.stdout}`)
    assert.equal(readFileSync(join(root, 'public/assets/keep.txt'), 'utf8'), 'existing host assets')
    const assets = readdirSync(join(root, 'public/master-css'), { recursive: true }) as string[]
    const seen = new Set<string>()
    function readCSS(name: string): string {
      if (seen.has(name)) return ''
      seen.add(name)
      const css = readFileSync(join(root, 'public/master-css', name), 'utf8')
      return css + [...css.matchAll(/@import ["']\.\/([^"']+)["']/g)].map(([, dependency]) => readCSS(decodeURIComponent(dependency))).join('\n')
    }
    const css = readCSS('app.css')
    if (isStatic) {
      assert.match(css, /font-style:italic/, route)
      assert.ok(!assets.some(name => /\.wasm$|master-css-manifest/.test(name)))
    } else assert.ok(assets.some(name => name.endsWith('.wasm')), 'Runtime Wasm is emitted')
    let url: string | undefined
    if (host === 'rails') {
      // Evaluate the actual view and layout in Ruby. These empty helper outputs
      // explicitly stand in for host metadata/importmaps, not a Rails server.
      const script = `require 'erb'\nclass Layout\n  def csrf_meta_tags; ''; end\n  def csp_meta_tag; ''; end\n  def javascript_importmap_tags; ''; end\n  def render\n    ERB.new(File.read('app/views/layouts/application.html.erb')).result(binding)\n  end\nend\nview = ERB.new(File.read('app/views/home/index.html.erb')).result\nputs Layout.new.render { view }\n`
      const rendered = spawnSync('ruby', ['-e', script], { cwd: root, encoding: 'utf8', timeout: 10000 })
      assert.equal(rendered.status, 0, rendered.stderr)
      write('public/index.html', rendered.stdout)
      const syntax = spawnSync('ruby', ['-c', 'config/routes.rb'], { cwd: root, encoding: 'utf8' })
      assert.equal(syntax.status, 0, syntax.stderr)
    } else {
      const port = await unusedPort()
      const command = host === 'express' ? process.execPath : 'php'
      const args = host === 'express' ? ['app.mjs'] : ['-S', `127.0.0.1:${port}`, '-t', 'public']
      child = spawn(command, args, { cwd: root, env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] })
      child.stderr?.on('data', data => { errors += data.toString() })
      child.on('error', error => { errors += error.message })
      url = `http://127.0.0.1:${port}/`
      let response: Response | undefined
      for (let attempt = 0; attempt < 100; attempt++) {
        try { response = await fetch(url); if (response.ok) break } catch { /* Server startup. */ }
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      assert.ok(response?.ok, errors)
      const html = await response.text()
      assert.match(html, /Hello World/)
      assert.doesNotMatch(html, /<html[^>]*\bhidden\b/)
      if (host === 'express' && !isStatic) assert.match(html, /font-style:italic/)
      write('response.html', html)
      assert.ok((await fetch(url + 'master-css/app.css')).ok)
    }
    return { root: join(root, 'public'), url, dispose }
  } catch (error) { await dispose(); throw error }
}
export async function verifyServerInstallationExamples() {
  for (const route of serverInstallationRoutes) await (await serverInstallationFixture(route)).dispose()
}
