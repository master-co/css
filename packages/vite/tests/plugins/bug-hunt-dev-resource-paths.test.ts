import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createServer } from 'vite'
import { expect, test } from 'vitest'
import masterCSS from '../../src/core'

const cases = (['static', 'progressive'] as const).flatMap(mode =>
  [...['pixel.svg', 'pixel space.svg', 'pixel#part.svg', 'pixel?query.svg', 'pixel%value.svg', '圖像.svg'].map(name => ({ mode, name, denied: false })), { mode, name: 'private.svg', denied: true }]
)

test.each(cases)('development resource path mode=$mode name=$name', async ({ mode, name, denied }) => {
  const parent = join(process.cwd(), 'tmp')
  mkdirSync(parent, { recursive: true })
  const root = mkdtempSync(join(parent, 'dev-resource-paths-'))
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  let publishedFiles: string[] = []
  try {
    writeFileSync(join(root, 'index.html'), '<!doctype html><div class="resource"></div>')
    writeFileSync(join(root, 'style.css'), `@master entry;@preserve native;.resource{background-image:url("./${encodeURIComponent(name)}?variant=1#part")}`)
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><title>exact-resource</title></svg>'
    writeFileSync(join(root, name), svg)
    server = await createServer({ root, base: '/base/', configFile: false, logLevel: 'silent', plugins: masterCSS({ mode }), server: { host: '127.0.0.1', port: 0, ...(denied ? { fs: { deny: ['**/private.svg'] } } : {}) } })
    await server.listen()
    const origin = server.resolvedUrls!.local[0]
    const response = await fetch(new URL('style.css?direct', origin))
    const css = await response.text()
    expect(response.status, css).toBe(200)
    const resource = css.match(/url\(["']?([^"'\)]+\/resource\/[^"'\)]+)["']?\)/)?.[1]
    expect(resource, css).toBeDefined()
    const url = new URL(resource!, origin)
    expect(decodeURIComponent(url.pathname.split('/').at(-1)!)).toBe(name)
    expect(url.search).toBe('?variant=1')
    expect(url.hash).toBe('#part')
    const asset = await fetch(url)
    const body = await asset.text()
    if (denied) {
      expect(asset.status).toBe(403)
      expect(body).not.toContain('exact-resource')
      return
    }
    expect(asset.status, body).toBe(200)
    expect(asset.headers.get('content-type')).toContain('image/svg+xml')
    expect(body).toBe(svg)
    const range = await fetch(url, { headers: { Range: 'bytes=0-3' } })
    expect(range.status).toBe(206)
    expect(await range.text()).toBe('<svg')
    publishedFiles = server.config.server.fs.allow.filter(file => file.includes('/master-css-vite-resources-'))
    expect(publishedFiles.length).toBeGreaterThan(0)
    expect(publishedFiles.every(file => existsSync(file))).toBe(true)
  } finally {
    await server?.environments.client.waitForRequestsIdle()
    await server?.close()
    rmSync(root, { recursive: true, force: true })
    expect(publishedFiles.every(file => !existsSync(file))).toBe(true)
  }
})
