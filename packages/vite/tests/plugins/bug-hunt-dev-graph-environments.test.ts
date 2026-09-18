import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createServer as createHTTPServer } from 'node:http'
import { createRunnableDevEnvironment, createServer, isRunnableDevEnvironment } from 'vite'
import { expect, test, vi } from 'vitest'
import masterCSS from '../../src/core'

const cases = (['static', 'runtime', 'pre-render', 'progressive'] as const).flatMap(mode => [false, true].map(perEnvironment => ({ mode, perEnvironment })))

async function readGraph(css: string, origin: string) {
  const assets = new Map<string, { body: string, mime: string | null }>(), sources = [css]
  expect(css).not.toContain('.invalid/_master-css/')
  for (let index = 0; index < sources.length; index++) {
    for (const match of sources[index].matchAll(/["']([^"']*\/_master-css\/dev\/[^"']+)["']/g)) {
      const url = new URL(match[1], origin).href
      if (assets.has(url)) continue
      const response = await fetch(url), body = await response.text(), mime = response.headers.get('content-type')
      expect(response.status, body).toBe(200)
      expect(mime).toMatch(/text\/css|image\/svg\+xml/)
      assets.set(url, { body, mime })
      if (mime?.includes('text/css')) sources.push(body)
    }
  }
  expect(assets.size).toBeGreaterThan(1)
  return { assets, css: sources.join('\n') }
}

async function expectAssets(assets: Awaited<ReturnType<typeof readGraph>>['assets']) {
  for (const [url, expected] of assets) {
    const response = await fetch(url)
    expect({ body: await response.text(), mime: response.headers.get('content-type'), status: response.status }).toEqual({ ...expected, status: 200 })
  }
}

function makeRoot() {
  const parent = join(process.cwd(), 'tmp')
  mkdirSync(parent, { recursive: true })
  const root = mkdtempSync(join(parent, 'dev-graph-environments-'))
  for (const [name, color] of [['initial', 'red'], ['later', 'green']]) {
    writeFileSync(join(root, `${name}.css`), `@import "./${name}-child.css" layer(guard);@master entry;@preserve native;`)
    writeFileSync(join(root, `${name}-child.css`), `@import "/base/external.css";.${name}{color:${color};background-image:url("./${name}%23%3F.svg?q=1#part")}`)
    writeFileSync(join(root, `${name}#?.svg`), `<svg xmlns="http://www.w3.org/2000/svg"><title>${color}</title></svg>`)
    writeFileSync(join(root, `${name}.js`), `export { default as css } from './${name}.css?inline'`)
  }
  writeFileSync(join(root, 'index.html'), '<!doctype html><div class="initial later"></div>')
  return root
}

test.each(cases)('retained graphs survive idle environment replacement mode=$mode perEnvironment=$perEnvironment', async ({ mode, perEnvironment }) => {
  const root = makeRoot(), copies = new Set<string>()
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  try {
    server = await createServer({ root, base: '/base/', configFile: false, logLevel: 'silent', plugins: masterCSS({ mode }),
      environments: { edge: { consumer: 'server', dev: { createEnvironment: (name, config) => createRunnableDevEnvironment(name, config) } } },
      server: { host: '127.0.0.1', port: 0, perEnvironmentStartEndDuringDev: perEnvironment } })
    await server.listen()
    const origin = server.resolvedUrls!.local[0], old = server.environments.edge
    if (!isRunnableDevEnvironment(old)) throw new Error('Expected runnable edge environment')
    const initial = await readGraph((await old.runner.import('/initial.js')).css, origin)
    expect(initial.css).toMatch(/color:\s*red/)
    const replacement = createRunnableDevEnvironment('edge', server.config)
    await replacement.init({ watcher: server.watcher, previousInstance: old })
    server.environments.edge = replacement
    await old.close()
    await replacement.listen(server)
    await server.environments.client.waitForRequestsIdle()
    await server.environments.client.close()
    await server.environments.ssr.close()
    await expectAssets(initial.assets)
    const later = await readGraph((await replacement.runner.import('/later.js')).css, origin)
    expect(later.css).toMatch(/\.later\s*\{[^}]*color:\s*green/)
    writeFileSync(join(root, 'later-child.css'), '@import "/base/external.css";.later{color:purple;background-image:url("./later%23%3F.svg?q=1#part")}')
    await vi.waitFor(async () => expect((await readGraph((await replacement.runner.import('/later.js')).css, origin)).css).toMatch(/\.later\s*\{[^}]*color:\s*purple/), { timeout: 10000 })
    await expectAssets(initial.assets)
    await expectAssets(later.assets)
    for (const file of server.config.server.fs.allow) if (file.includes('/master-css-vite-resources-')) copies.add(file)
  } finally {
    await server?.environments.client.waitForRequestsIdle()
    await server?.close()
    rmSync(root, { recursive: true, force: true })
    expect([...copies].every(file => !existsSync(file))).toBe(true)
  }
})

const restartCases = (['static', 'runtime', 'pre-render', 'progressive'] as const).flatMap(mode => [false, true].map(middleware => ({ mode, middleware })))
test.each(restartCases)('retained graph restart mode=$mode middleware=$middleware', async ({ mode, middleware }) => {
  const root = makeRoot(), copies = new Set<string>()
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  const http = createHTTPServer((request, response) => server!.middlewares(request, response, () => { response.statusCode = 404;response.end() }))
  try {
    server = await createServer({ root, base: '/base/', configFile: false, logLevel: 'silent', plugins: masterCSS({ mode }), server: middleware ? { middlewareMode: true, ws: { server: http } } : { host: '127.0.0.1', port: 0 } })
    if (middleware) await new Promise<void>(resolve => { http.listen(0, '127.0.0.1', resolve) })
    else await server.listen()
    const address = http.address()
    const origin = middleware && address && typeof address !== 'string' ? `http://127.0.0.1:${address.port}/base/` : server.resolvedUrls!.local[0]
    const old = await readGraph((await server.ssrLoadModule('/initial.js')).css, origin)
    const oldCopies = server.config.server.fs.allow.filter(file => file.includes('/master-css-vite-resources-'))
    expect(oldCopies.length).toBeGreaterThan(0)
    await server.restart()
    expect(oldCopies.every(file => !existsSync(file))).toBe(true)
    const currentOrigin = middleware ? origin : server.resolvedUrls!.local[0]
    const current = await readGraph((await server.ssrLoadModule('/initial.js')).css, currentOrigin)
    expect([...current.assets.keys()].sort()).not.toEqual([...old.assets.keys()].sort())
    writeFileSync(join(root, 'initial-child.css'), '@import "/base/external.css";.initial{color:purple;background-image:url("./initial%23%3F.svg?q=1#part")}')
    await vi.waitFor(async () => expect((await readGraph((await server!.ssrLoadModule('/initial.js')).css, currentOrigin)).css).toMatch(/\.initial\s*\{[^}]*color:\s*purple/), { timeout: 10000 })
    await expectAssets(current.assets)
    for (const file of server.config.server.fs.allow) if (file.includes('/master-css-vite-resources-')) copies.add(file)
  } finally {
    await server?.environments.client.waitForRequestsIdle()
    await server?.close()
    if (http.listening) await new Promise<void>(resolve => { http.close(() => resolve()) })
    rmSync(root, { recursive: true, force: true })
    expect([...copies].every(file => !existsSync(file))).toBe(true)
  }
})
