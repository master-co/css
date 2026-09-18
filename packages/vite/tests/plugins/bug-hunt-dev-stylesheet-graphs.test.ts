import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createServer } from 'vite'
import { expect, test } from 'vitest'
import masterCSS from '../../src/core'

test.each(['static', 'runtime', 'pre-render', 'progressive'] as const)('BH-0004 dev delivers qualified child CSS and resources in %s', async mode => {
  const parent = join(process.cwd(), 'tmp')
  mkdirSync(parent, { recursive: true })
  const root = mkdtempSync(join(parent, 'dev-graphs-'))
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  try {
    writeFileSync(join(root, 'server.js'), 'export { default as css } from "./style.css?inline"')
    writeFileSync(join(root, 'index.html'), '<!doctype html><div class="conditional"></div>')
    writeFileSync(join(root, 'style.css'), '@import "./child.css" layer(guard) supports(display:grid) screen and (min-width:700px);@master entry;@preserve native;')
    writeFileSync(join(root, 'child.css'), '@import "https://example.invalid/external.css";.conditional{color:red;background-image:url("./pixel.svg?q=1#part")}')
    writeFileSync(join(root, 'pixel.svg'), '<svg xmlns="http://www.w3.org/2000/svg"><title>dev-graph</title></svg>')
    server = await createServer({ root, base: '/base/', configFile: false, logLevel: 'silent', plugins: masterCSS({ mode }), server: { host: '127.0.0.1', port: 0 } })
    await server.listen()
    const origin = server.resolvedUrls!.local[0]
    const css: string[] = [], pending = [new URL('style.css?direct', origin).href], seen = new Set<string>()
    while (pending.length) {
      const url = pending.pop()!
      if (seen.has(url)) continue
      seen.add(url)
      const response = await fetch(url)
      const source = await response.text()
      expect(response.status, source).toBe(200)
      expect(response.headers.get('content-type')).toContain('text/css')
      expect(source).not.toContain('.invalid/_master-css/')
      css.push(source)
      for (const match of source.matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]/g)) {
        if (!match[1].includes('example.invalid')) pending.push(new URL(match[1], url).href)
      }
    }
    const source = css.join('\n')
    expect(source).toContain('https://example.invalid/external.css')
    expect(source).toContain('layer(guard)')
    expect(source).toMatch(/supports\(display:\s*grid\)/)
    expect(source).toMatch(/(?:min-width:\s*700px|width\s*>=\s*700px)/)
    expect(source).toMatch(/color:\s*red/)
    const resource = source.match(/url\(['"]?([^'"\)]+\/resource\/[^'"\)]+)['"]?\)/)?.[1]
    expect(resource).toBeDefined()
    expect(resource).toContain('?q=1#part')
    const response = await fetch(new URL(resource!, origin))
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('image/svg+xml')
    expect(await response.text()).toContain('dev-graph')
    const rendered = await server.ssrLoadModule('/server.js')
    expect(rendered.css).not.toContain('.invalid/_master-css/')
    const inlineSources = [rendered.css as string], inlineSeen = new Set<string>()
    for (let index = 0; index < inlineSources.length; index++) {
      for (const match of inlineSources[index].matchAll(/@import\s+"([^"]+)"/g)) {
        if (match[1].includes('example.invalid') || inlineSeen.has(match[1])) continue
        inlineSeen.add(match[1])
        const asset = await fetch(new URL(match[1], origin))
        expect(asset.status).toBe(200)
        inlineSources.push(await asset.text())
      }
    }
    expect(inlineSources.join('\n').match(/layer\(guard\)/g)).toHaveLength(1)
  } finally {
    await server?.environments.client.waitForRequestsIdle()
    await server?.close()
    rmSync(root, { recursive: true, force: true })
  }
})
