import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'vite'
import { expect, test } from 'vitest'
import masterCSS from '../../src/core'

for (const format of ['es', 'cjs'] as const) {
  test.each([false, true])(`BH-0004 ${format} SSR inline uses public URLs and respects asset emission %s`, async (emitAssets) => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-ssr-inline-')))
    try {
      writeFileSync(join(root, 'entry.js'), 'import css from "./style.css?inline";export {css}')
      writeFileSync(join(root, 'style.css'), '@master entry;@preserve native;.example{color:blue;background:url(pixel.svg?q=1#part)}')
      writeFileSync(join(root, 'pixel.svg'), '<svg/>')
      const result = await build({ root, configFile: false, logLevel: 'silent', base: '/deployed/', plugins: [masterCSS({ mode: 'static', runtime: false })], build: { ssr: join(root, 'entry.js'), ssrEmitAssets: emitAssets, minify: false, rolldownOptions: { output: { format, entryFileNames: `entry.${format === 'es' ? 'mjs' : 'cjs'}`, assetFileNames: 'styles/[name]-[hash][extname]' } } } })
      if (Array.isArray(result) || 'on' in result) throw new Error('Expected one output')
      const entry = result.output.find(item => item.type === 'chunk' && item.isEntry)!
      const file = join(root, 'dist', entry.fileName)
      const { css } = format === 'cjs' ? createRequire(import.meta.url)(file) : await import(pathToFileURL(file).href)
      expect(css).toContain('/deployed/styles/master-css-resource-')
      expect(css).toContain('?q=1#part')
      expect(css).not.toContain('file:')
      expect(css).not.toContain('master-css-slot')
      const assets = result.output.filter(item => item.type === 'asset')
      if (emitAssets) expect(assets.some(item => item.fileName.endsWith('.svg'))).toBe(true)
      else expect(assets).toHaveLength(0)
    } finally { rmSync(root, { recursive: true, force: true }) }
  })
}
