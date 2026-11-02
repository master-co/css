import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { build } from 'vite'
import { expect, test } from 'vitest'
import masterCSS from '../../src/core'
import { getBuildImportResolver } from '../../src/utils/build-import-resolver'

test('SSR package externalization keeps Master CSS style resolution and respects other externals', async () => {
  const resolver = getBuildImportResolver({} as never, {
    resolve: async id => ({ id, external: true })
  })!
  expect(await resolver('@master/css', '/site/app.css')).toBeUndefined()
  expect(await resolver('@master/css-preset', '/site/app.css')).toBeUndefined()
  expect(await resolver('https://example.com/fonts.css', '/site/app.css')).toBeNull()
  expect(await resolver('external-theme.css', '/site/app.css')).toBeNull()
})

test('SSR builds deliver the native preset from installed packages', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-installed-ssr-css-'))
  try {
    for (const [name, source] of [['css', '../css'], ['css-preset', '../preset']]) {
      const destination = join(root, 'node_modules/@master', name)
      mkdirSync(destination, { recursive: true })
      for (const file of ['package.json', 'src']) cpSync(resolve(source, file), join(destination, file), { recursive: true })
      // Installed JS entrypoints exist even when this stylesheet only needs their CSS export.
      mkdirSync(join(destination, 'dist'))
      writeFileSync(join(destination, 'dist/index.js'), 'export {}')
    }
    writeFileSync(join(root, 'package.json'), '{"type":"module"}')
    writeFileSync(join(root, 'entry.js'), 'import "./app.css";export const html = "<main>Native defaults</main>"')
    writeFileSync(join(root, 'app.css'), '@import "@master/css";')
    const result = await build({
      root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode: 'static' }),
      build: { ssr: 'entry.js', emitAssets: true, write: false, cssMinify: false }
    })
    if (Array.isArray(result) || 'on' in result) throw new Error('Expected one build output')
    const css = result.output.filter(asset => asset.type === 'asset' && asset.fileName.endsWith('.css'))
      .map(asset => asset.type === 'asset' ? String(asset.source) : '').join('\n')
    expect(css).toContain('font-family: var(--font-family-sans)')
    expect(css).toContain('@layer base {')
    expect(css).not.toMatch(/@import\s+["']@master\/css/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}, 120_000)
