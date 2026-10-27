import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createServer } from 'vite'
import { expect, test } from 'vitest'
import masterCSS from '../../src/core'
import { DEV_RUNTIME_ENTRY_ID } from '../../src/common'

const cases = (['runtime', 'progressive'] as const).flatMap(mode =>
  ['/', '/base/', '/deep/base/', '', './', 'https://cdn.example.test/base/'].map(base => ({ mode, base }))
)

test.each(cases)('dev runtime is served with mode=$mode base=$base', async ({ mode, base }) => {
  const parent = join(process.cwd(), 'tmp')
  mkdirSync(parent, { recursive: true })
  const root = mkdtempSync(join(parent, 'runtime-dev-base-'))
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  try {
    const source = '<!doctype html><div id="target"></div>'
    writeFileSync(join(root, 'index.html'), source)
    mkdirSync(join(root, 'nested'))
    writeFileSync(join(root, 'nested/page.html'), source)
    server = await createServer({ root, configFile: false, logLevel: 'silent', base, plugins: masterCSS({ mode }), server: { host: '127.0.0.1', port: 0 } })
    await server.listen()
    const origin = server.resolvedUrls!.local[0]
    for (const route of ['', 'nested/page.html']) {
      const response = await fetch(new URL(route, origin))
      expect(response.status).toBe(200)
      const html = await response.text()
      const script = html.match(/<script\b[^>]*src="([^"]*virtual:master-css-runtime)"[^>]*>/)?.[1]
      expect(script).toBeDefined()
      const runtime = await fetch(new URL(script!, origin))
      const result = { script, status: runtime.status, text: await runtime.text() }
      expect(result.status, JSON.stringify(result)).toBe(200)
      expect(result.text).toContain('import')
      expect(script).toBe(server.config.base + DEV_RUNTIME_ENTRY_ID.slice(1))
      if (mode === 'runtime') {
        const preload = html.match(/<link\b[^>]*rel="modulepreload"[^>]*href="([^"]*virtual:master-css-runtime)"[^>]*>/)?.[1]
        expect(preload).toBe(script)
      }
    }
  } finally {
    await server?.close()
    rmSync(root, { recursive: true, force: true })
  }
})
