import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createServer } from 'vite'
import { expect, test } from 'vitest'
import masterCSS from '../../src/core'

test('shared plugin roots retain resource delivery as another root or SSR environment closes', async () => {
  const parent = join(process.cwd(), 'tmp')
  mkdirSync(parent, { recursive: true })
  const roots = [0, 1].map(() => mkdtempSync(join(parent, 'dev-resource-lifecycle-')))
  const servers: Awaited<ReturnType<typeof createServer>>[] = [], copies = new Set<string>()
  const plugins = masterCSS({ mode: 'static' })
  const images = ['red', 'blue'].map(color => `<svg xmlns="http://www.w3.org/2000/svg"><title>${color}</title></svg>`)
  const urls: URL[] = []
  try {
    for (const [index, root] of roots.entries()) {
      writeFileSync(join(root, 'style.css'), '@master entry;@preserve native;.resource{background-image:url("./pixel%23%3F.svg")}')
      writeFileSync(join(root, 'pixel#?.svg'), images[index])
      writeFileSync(join(root, 'server.js'), 'export { default as css } from "./style.css?inline"')
      const server = await createServer({ root, base: `/base-${index}/`, configFile: false, logLevel: 'silent', plugins, server: { host: '127.0.0.1', port: 0 } })
      servers.push(server);await server.listen()
      const origin = server.resolvedUrls!.local[0]
      const response = await fetch(new URL('style.css?direct', origin))
      const css = await response.text()
      expect(response.status).toBe(200)
      const href = css.match(/url\(["']?([^"'\)]+\/resource\/[^"'\)]+)["']?\)/)?.[1]
      expect(href, css).toBeDefined()
      const url = new URL(href!, origin);urls.push(url)
      expect(await (await fetch(url)).text()).toBe(images[index])
      const rendered = await server.ssrLoadModule('/server.js')
      expect(rendered.css).toContain(href)
      for (const file of server.config.server.fs.allow) if (file.includes('/master-css-vite-resources-')) copies.add(file)
    }
    expect(urls[0].pathname).not.toBe(urls[1].pathname)
    await servers[0].environments.client.waitForRequestsIdle()
    await servers[0].close()
    expect(await (await fetch(urls[1])).text()).toBe(images[1])
    await servers[1].environments.ssr.close()
    expect(await (await fetch(urls[1])).text()).toBe(images[1])
    const remaining = await fetch(new URL('style.css?direct', servers[1].resolvedUrls!.local[0]))
    expect(remaining.status).toBe(200)
    expect(await remaining.text()).toContain(urls[1].pathname)
  } finally {
    for (const server of servers) {
      await server.environments.client.waitForRequestsIdle()
      await server.close()
    }
    for (const root of roots) rmSync(root, { recursive: true, force: true })
    expect([...copies].every(file => !existsSync(file))).toBe(true)
  }
})

test('published CSS and resource versions remain readable after a new graph is composed', async () => {
  const parent = join(process.cwd(), 'tmp')
  mkdirSync(parent, { recursive: true })
  const root = mkdtempSync(join(parent, 'dev-resource-versions-'))
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  try {
    writeFileSync(join(root, 'style.css'), '@import "./child.css" layer(guard);@master entry;@preserve native;')
    const writeVersion = (color: string) => {
      writeFileSync(join(root, 'child.css'), `@import "/base/external.css";.resource{color:${color};background-image:url("./pixel.svg")}`)
      writeFileSync(join(root, 'pixel.svg'), `<svg xmlns="http://www.w3.org/2000/svg"><title>${color}</title></svg>`)
    }
    writeVersion('red')
    server = await createServer({ root, base: '/base/', configFile: false, logLevel: 'silent', plugins: masterCSS({ mode: 'static' }), server: { host: '127.0.0.1', port: 0, watch: { ignored: ['**/*'] } } })
    await server.listen()
    const origin = server.resolvedUrls!.local[0]
    const readGraph = async () => {
      const result = new Map<string, { status: number, body: string }>()
      const pending = [new URL('style.css?direct', origin).href]
      while (pending.length) {
        const url = pending.pop()!
        if (result.has(url)) continue
        const response = await fetch(url), body = await response.text()
        expect(response.status, body).toBe(200)
        result.set(url, { status: response.status, body })
        for (const match of body.matchAll(/["']([^"']*\/_master-css\/dev\/[^"']+)["']/g)) pending.push(new URL(match[1], url).href)
      }
      result.delete(new URL('style.css?direct', origin).href)
      return result
    }
    const first = await readGraph()
    expect(first.size).toBeGreaterThan(1)
    writeVersion('blue')
    server.environments.client.moduleGraph.invalidateAll()
    const second = await readGraph()
    expect([...second.values()].map(value => value.body).join('\n')).toContain('blue')
    expect([...second.keys()].sort()).not.toEqual([...first.keys()].sort())
    const previous = new Map<string, { status: number, body: string }>()
    for (const url of first.keys()) {
      const response = await fetch(url)
      previous.set(url, { status: response.status, body: await response.text() })
    }
    expect(previous).toEqual(first)
  } finally {
    await server?.environments.client.waitForRequestsIdle()
    await server?.close()
    rmSync(root, { recursive: true, force: true })
  }
})
