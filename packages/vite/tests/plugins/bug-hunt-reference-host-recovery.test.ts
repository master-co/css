import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { build, createServer } from 'vite'
import { expect, test, vi } from 'vitest'
import masterCSS from '../../src/core'

const require = createRequire(import.meta.url)
const sassDirectory = dirname(createRequire(require.resolve('vite')).resolve('sass'))
const cases = ['scss', 'sass'].flatMap(syntax => ['plain-root', 'module-root', 'retained-module'].flatMap(kind => [false, true].map(startupMissing => ({ syntax, kind, startupMissing }))))

function fixture(syntax: string, kind: string, startupMissing: boolean) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-reference-recovery-')))
  mkdirSync(join(root, 'node_modules')); symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
  for (const directory of ['main', 'shared']) mkdirSync(join(root, directory))
  const reference = join(root, 'shared/tokens.css'), pixel = join(root, 'shared/pixel.svg')
  const tokens = (padding: number) => `@utilities{paint{padding:${padding}rem;background:url("./pixel.svg?v=1#icon")}}.never{color:red}`
  if (!startupMissing) writeFileSync(reference, tokens(2))
  writeFileSync(pixel, '<svg xmlns="http://www.w3.org/2000/svg" data-owner="reference"/>')
  writeFileSync(join(root, `shared/_rules.${syntax}`), syntax === 'scss' ? '@reference "./tokens.css";.target{@compose paint;}' : '@reference "./tokens.css"\n.target\n  @compose paint\n')
  const input = syntax === 'scss' ? '@use "../shared/rules";' : '@use "../shared/rules"\n'
  const filename = kind === 'plain-root' ? `main/style.${syntax}` : kind === 'module-root' ? `main/style.module.${syntax}` : 'style.module.css'
  if (kind === 'retained-module') writeFileSync(join(root, `main/child.${syntax}`), input)
  writeFileSync(join(root, filename), kind === 'retained-module' ? `@import "./main/child.${syntax}" layer(owner);` : input)
  writeFileSync(join(root, 'entry.js'), `import "./${filename}";if(import.meta.hot)import.meta.hot.accept("./${filename}",()=>{});`)
  writeFileSync(join(root, 'index.html'), '<div class="target"></div><script type="module" src="./entry.js"></script>')
  return { root, reference, pixel, filename, tokens, config: { root, cacheDir: join(root, '.vite'), configFile: false as const, logLevel: 'silent' as const, plugins: masterCSS({ mode: 'static', runtime: false }) } }
}

test.each(cases)('BH-0004 dev reference recovery $syntax/$kind/startup=$startupMissing', async ({ syntax, kind, startupMissing }) => {
  const f = fixture(syntax, kind, startupMissing)
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  try {
    server = await createServer({ ...f.config, server: { host: '127.0.0.1', port: 0 } })
    await server.listen()
    const origin = server.resolvedUrls!.local[0]
    const entry = await fetch(new URL('entry.js', origin)); expect(entry.status).toBe(200); await entry.text()
    const readGraph = async () => {
      const pending = [new URL(f.filename, origin).href], seen = new Set<string>(), sources: string[] = []
      while (pending.length) {
        const url = pending.pop()!
        if (seen.has(url)) continue
        seen.add(url)
        const response = await fetch(url), body = await response.text()
        if (response.status !== 200) return { status: response.status, body, sources }
        const css = body.match(/const __vite__css = ("(?:[^"\\]|\\.)*")/)
        const source = css ? JSON.parse(css[1]) as string : body
        sources.push(source)
        for (const match of source.matchAll(/(?:@import\s+(?:url\()?|\bimport\s+)["']([^"']+\.css(?:[^"']*)?)["']/g)) pending.push(new URL(match[1], url).href)
      }
      return { status: 200, body: sources.join('\n'), sources }
    }
    const observed: unknown[] = []
    server.watcher.on('all', (event, file) => { if (file === f.reference) observed.push({ event, file }) })
    const initial = await readGraph()
    expect(initial.status).toBe(startupMissing ? 500 : 200)
    if (!startupMissing) expect(initial.body).toMatch(/padding:\s*2rem/)
    if (process.env.BH_TRACE) console.log('dev-initial', JSON.stringify({ kind, syntax, startupMissing, status: initial.status, body: initial.body.slice(0, 1000), watched: server.watcher.getWatched()[dirname(f.reference)], modules: [...(server.environments.client.moduleGraph.getModulesByFile(f.reference) ?? [])].map(module => module.id) }))
    const send = vi.spyOn(server.ws, 'send')
    const waitNotification = () => vi.waitFor(() => expect(send.mock.calls.some((args: readonly unknown[]) => {
      const message = args[0]
      return Boolean(message && typeof message === 'object' && 'type' in message && ['update', 'full-reload', 'error'].includes(String(message.type)))
    }), JSON.stringify({ observed, messages: send.mock.calls })).toBe(true), { timeout: 5000 })
    if (!startupMissing) {
      rmSync(f.reference)
      await waitNotification()
      await expect.poll(async () => (await readGraph()).status, { timeout: 5000 }).toBe(500)
    }
    send.mockClear()
    writeFileSync(f.reference, f.tokens(7))
    await waitNotification()
    await expect.poll(async () => {
      const result = await readGraph()
      return result.status === 200 && /padding:\s*7rem/.test(result.body)
    }, { timeout: 5000 }).toBe(true)
    const restored = await readGraph()
    expect(restored.body).not.toMatch(/\.never|@reference|@compose/)
    const resource = restored.body.match(/url\(["']?([^"'\)]+\.svg[^"'\)]*)["']?\)/)?.[1]
    expect(resource).toBeDefined()
    const response = await fetch(new URL(resource!, origin))
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('image/svg+xml')
    expect(await response.text()).toBe(readFileSync(f.pixel, 'utf8'))
  } finally { await server?.environments.client.waitForRequestsIdle(); await server?.close(); rmSync(f.root, { recursive: true, force: true }) }
})

test.each(cases)('BH-0004 build-watch reference recovery $syntax/$kind/startup=$startupMissing', async ({ syntax, kind, startupMissing }) => {
  const f = fixture(syntax, kind, startupMissing)
  let watcher: { close(): Promise<void> } | undefined
  const closing: Promise<void>[] = []
  try {
    const result = await build({ ...f.config, build: { watch: {}, minify: false, assetsInlineLimit: 0 } })
    if (!('on' in result)) throw new Error('Missing Vite build watcher')
    watcher = result
    const events: { code: string, error?: unknown }[] = []
    let terminal: { code: string, error?: unknown } | undefined
    result.on('event', event => {
      if (process.env.BH_TRACE) console.log('build-event', JSON.stringify({ kind, syntax, startupMissing, code: event.code, ...(event.code === 'ERROR' ? { error: String(event.error), details: event.error } : {}) }))
      if (event.code === 'BUNDLE_END') closing.push(event.result.close())
      if (event.code === 'BUNDLE_END' || event.code === 'ERROR') terminal = event
      if (event.code === 'END' && terminal) { events.push(terminal); terminal = undefined }
    })
    const nextEvent = async (phase: string) => { await vi.waitFor(() => expect(events.length, phase).toBeGreaterThan(0), { timeout: 5000 }); return events.shift()! }
    const initial = await nextEvent('initial')
    expect(initial.code).toBe(startupMissing ? 'ERROR' : 'BUNDLE_END')
    const output = () => readdirSync(join(f.root, 'dist'), { recursive: true, withFileTypes: true }).filter(file => file.isFile()).map(file => readFileSync(join(file.parentPath, file.name), 'utf8')).join('\n')
    if (!startupMissing) {
      expect(output()).toMatch(/padding:\s*2rem/)
      rmSync(f.reference)
      expect((await nextEvent('deleted')).code).toBe('ERROR')
    }
    writeFileSync(f.reference, f.tokens(7))
    const restored = await nextEvent('restored')
    expect(restored.code, String(restored.error)).toBe('BUNDLE_END')
    const css = output()
    expect(css).toMatch(/padding:\s*7rem/)
    expect(css).toContain('data-owner="reference"')
    expect(css).not.toMatch(/\.never|@reference|@compose/)
    await Promise.all(closing)
  } finally { await watcher?.close(); await Promise.all(closing); rmSync(f.root, { recursive: true, force: true }) }
})

// A closed SSR environment must not remove the client's failed dependency edges.
test.each([false, true])('BH-0004 external missing reference survives SSR close; check obsolete edges=%s', async (checkObsolete) => {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-external-reference-')))
  const root = join(parent, 'app'), external = join(parent, 'external'), source = join(root, 'style.css'), reference = join(external, 'tokens.css')
  mkdirSync(root); mkdirSync(external)
  writeFileSync(source, '@reference "../external/tokens.css";.target{@compose paint;}')
  writeFileSync(join(root, 'entry.js'), 'import "./style.css";if(import.meta.hot)import.meta.hot.accept("./style.css",()=>{});')
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  try {
    server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode: 'static', runtime: false }), server: { host: '127.0.0.1', port: 0, fs: { allow: [parent] } } })
    await server.listen()
    await server.environments.client.transformRequest('/entry.js')
    await expect(server.environments.client.transformRequest('/style.css')).rejects.toThrow('ENOENT')
    await expect(server.environments.ssr.transformRequest('/style.css')).rejects.toThrow('ENOENT')
    await server.environments.ssr.close()
    const send = vi.spyOn(server.ws, 'send')
    writeFileSync(reference, '@utilities{paint{padding:7rem}}')
    await vi.waitFor(() => expect(send.mock.calls.length).toBeGreaterThan(0), { timeout: 5000 })
    expect((await server.environments.client.transformRequest('/style.css'))?.code).toContain('7rem')
    if (!checkObsolete) return
    // Remove this dependency through a successful source transform before another edit.
    writeFileSync(source, '.target{padding:3rem}')
    await expect.poll(async () => (await server!.environments.client.transformRequest('/style.css'))?.code, { timeout: 5000 }).toContain('3rem')
    await server.environments.client.waitForRequestsIdle()
    send.mockClear()
    const observed = new Promise<void>(resolve => server!.watcher.on('change', file => { if (file === reference) resolve() }))
    writeFileSync(reference, '@utilities{paint{padding:99rem}}')
    await observed
    await new Promise(resolve => setTimeout(resolve, 200))
    expect(send.mock.calls.filter((args: readonly unknown[]) => args[0] && typeof args[0] === 'object' && 'type' in args[0] && ['update', 'full-reload'].includes(String(args[0].type)))).toEqual([])
    expect((await server.environments.client.transformRequest('/style.css'))?.code).toContain('3rem')
  } finally { await server?.environments.client.waitForRequestsIdle(); await server?.close(); rmSync(parent, { recursive: true, force: true }) }
})
