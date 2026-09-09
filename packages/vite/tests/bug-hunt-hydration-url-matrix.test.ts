import { expect, test } from 'vitest'
import { build } from 'vite'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import masterCSS from '../src'

test.each([
  { base: './', assetsDir: 'assets', mode: 'progressive' },
  { base: '', assetsDir: 'custom/files', mode: 'progressive' },
  { base: './', assetsDir: '', mode: 'progressive' },
  { base: '/app/', assetsDir: 'assets', mode: 'progressive' },
  { base: 'https://cdn.example.test/app/', assetsDir: 'assets', mode: 'progressive' },
  { base: './', assetsDir: 'custom/files', mode: 'pre-render' }
] as const)('BH-0016 resolves each emitted manifest for $mode / $base / $assetsDir', async ({ base, assetsDir, mode }) => {
  const temporaryParent = resolve('tmp')
  mkdirSync(temporaryParent, { recursive: true })
  const root = mkdtempSync(join(temporaryParent, 'audit-hydration-matrix-'))
  const names = ['index.html', 'pages/nested.html', 'pages/deep/index.html', 'custom/files/shared.html']
  try {
    for (const name of names) {
      mkdirSync(dirname(join(root, name)), { recursive: true })
      writeFileSync(join(root, name), '<html><head></head><body><div class="block"></div><script type="module" src="/main.ts"></script></body></html>')
    }
    writeFileSync(join(root, 'main.ts'), 'import "./master.css"')
    writeFileSync(join(root, 'master.css'), '@import "@master/css";')
    await build({
      root, base, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode }),
      build: { assetsDir, rollupOptions: { input: names.map(name => join(root, name)) } }
    })
    const assets = new Set<string>()
    for (const name of names) {
      const html = readFileSync(join(root, 'dist', name), 'utf8')
      const hrefs = [...html.matchAll(/data-master-css-hydration-manifest="([^"]+)"/g)].map(match => match[1])
      expect(hrefs, name).toHaveLength(1)
      const pageURL = new URL(name, 'https://app.example.test/app/')
      const url = new URL(hrefs[0], pageURL)
      expect(url.origin).toBe(base.startsWith('https:') ? 'https://cdn.example.test' : pageURL.origin)
      expect(url.pathname).toMatch(/^\/app\//)
      const asset = url.pathname.slice('/app/'.length)
      expect(asset).toMatch(new RegExp(`^${assetsDir ? assetsDir + '/' : ''}_master-css/hydration/master-css-hydration\\.[a-f0-9]{8}\\.json$`))
      const manifest = JSON.parse(readFileSync(join(root, 'dist', asset), 'utf8'))
      expect(manifest.rules.map((rule: { className: string }) => rule.className)).toContain('block')
      assets.add(asset)
    }
    // Same classes share JSON bytes, but each page gets its own relative URL.
    expect(assets.size).toBe(1)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
