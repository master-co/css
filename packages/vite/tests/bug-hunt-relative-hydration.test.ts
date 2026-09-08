import { expect, test } from 'vitest'
import { build } from 'vite'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import masterCSS from '../src'

test('BH-0016 nested HTML resolves its hydration asset when base is relative', async () => {
  const temporaryParent = resolve('tmp')
  mkdirSync(temporaryParent, { recursive: true })
  const root = mkdtempSync(join(temporaryParent, 'audit-relative-hydration-'))
  try {
    mkdirSync(join(root, 'pages'))
    const html = '<html><head></head><body><div class="block"></div><script type="module" src="/main.ts"></script></body></html>'
    writeFileSync(join(root, 'index.html'), html)
    writeFileSync(join(root, 'pages/nested.html'), html)
    writeFileSync(join(root, 'main.ts'), 'import "./master.css"')
    writeFileSync(join(root, 'master.css'), '@import "@master/css";')
    await build({
      root, base: './', configFile: false, logLevel: 'silent', plugins: masterCSS({ mode: 'progressive' }),
      build: { rollupOptions: { input: { main: join(root, 'index.html'), nested: join(root, 'pages/nested.html') } } }
    })
    for (const name of ['index.html', 'pages/nested.html']) {
      const output = join(root, 'dist', name)
      const rendered = readFileSync(output, 'utf8')
      const href = rendered.match(/data-master-css-hydration-manifest="([^"]+)"/)?.[1]
      expect(href, name).toBeTruthy()
      expect(existsSync(resolve(dirname(output), href!)), `${name}: ${href}`).toBe(true)
    }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
