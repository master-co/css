import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createServer } from 'vite'
import { expect, test } from 'vitest'
import masterCSS from '../../src/core'
import { watchDeadline } from '../watch-deadline-helper'

test.each(['static', 'runtime', 'pre-render', 'progressive'] as const)('resource deletion and restoration recover development CSS in %s', async mode => {
  const parent = join(process.cwd(), 'tmp')
  mkdirSync(parent, { recursive: true })
  const root = mkdtempSync(join(parent, 'dev-resource-recovery-')), file = join(root, 'pixel.svg')
  const svg = (color: string) => `<svg xmlns="http://www.w3.org/2000/svg"><title>${color}</title></svg>`
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  const copies = new Set<string>()
  try {
    writeFileSync(join(root, 'index.html'), '<!doctype html><div class="resource"></div>')
    writeFileSync(join(root, 'style.css'), '@master entry;@preserve native;.resource{background-image:url("./pixel.svg?q=1#part")}')
    writeFileSync(file, svg('red'))
    server = await createServer({ root, base: '/base/', configFile: false, logLevel: 'silent', plugins: masterCSS({ mode }), server: { host: '127.0.0.1', port: 0 } })
    await server.listen()
    const origin = server.resolvedUrls!.local[0]
    const readCSS = async () => {
      const response = await fetch(new URL('style.css?direct', origin))
      return { status: response.status, body: await response.text() }
    }
    const resourceURL = (css: string) => new URL(css.match(/url\(["']?([^"'\)]+\/resource\/[^"'\)]+)["']?\)/)![1], origin)
    const initial = await readCSS()
    expect(initial.status).toBe(200)
    const first = resourceURL(initial.body)
    expect(await (await fetch(first)).text()).toBe(svg('red'))
    rmSync(file)
    let missing = initial
    await expect.poll(async () => { missing = await readCSS();return missing.status }, { timeout: watchDeadline }).toBe(500)
    expect(missing.body).toContain('pixel.svg')
    expect(await (await fetch(first)).text()).toBe(svg('red'))
    writeFileSync(file, svg('blue'))
    let restored = missing
    await expect.poll(async () => { restored = await readCSS();return restored.status }, { timeout: watchDeadline }).toBe(200)
    const second = resourceURL(restored.body)
    expect(second.href).not.toBe(first.href)
    expect(await (await fetch(second)).text()).toBe(svg('blue'))
    expect(await (await fetch(first)).text()).toBe(svg('red'))
    for (const path of server.config.server.fs.allow) if (path.includes('/master-css-vite-resources-')) copies.add(path)
  } finally {
    await server?.environments.client.waitForRequestsIdle()
    await server?.close()
    rmSync(root, { recursive: true, force: true })
    expect([...copies].every(file => !existsSync(file))).toBe(true)
  }
})
