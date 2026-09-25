import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build } from 'vite'
import { expect, test } from 'vitest'
import masterCSS from '../../src/core'

test('builds ordinary theme variables used only by local CSS and a CSS Module', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-vite-theme-reference-'))
  try {
    writeFileSync(join(root, 'index.html'), '<!doctype html><div class="plain"></div><div class="module"></div><script type="module" src="./client.js"></script>')
    writeFileSync(join(root, 'client.js'), 'import "./app.css"; import "./plain.css"; import "./local.module.css"')
    writeFileSync(join(root, 'app.css'), '@import "@master/css";@theme light{--color-brand:#123456}@theme dark{--color-brand:#abcdef}')
    writeFileSync(join(root, 'plain.css'), '@reference "./app.css";.plain{color:var(--color-brand)}')
    writeFileSync(join(root, 'local.module.css'), '@reference "./app.css";.module{color:var(--color-brand)}')
    await build({ root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode: 'static' }), build: { minify: false, cssMinify: false } })
    const css = readdirSync(join(root, 'dist/assets')).filter(file => file.endsWith('.css'))
      .map(file => readFileSync(join(root, 'dist/assets', file), 'utf8')).join('\n')
    expect(css).toContain('--color-brand:#123456')
    expect(css).toContain('--color-brand:#abcdef')
    expect(css).toMatch(/\.plain\s*\{\s*color:\s*var\(--color-brand\)/)
    expect(css).toMatch(/\._module_[\w-]+\s*\{\s*color:\s*var\(--color-brand\)/)
    expect(css).not.toContain('@reference')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}, 120_000)
