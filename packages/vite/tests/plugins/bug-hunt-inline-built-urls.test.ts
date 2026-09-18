import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'vite'
import { expect, test } from 'vitest'
import masterCSS from '../../src/core'

async function fixture(run: (root: string) => Promise<void>) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-built-urls-')))
  try {
    writeFileSync(join(root, 'entry.js'), 'import css from "./style.css?inline";export {css}')
    writeFileSync(join(root, 'style.css'), '@import "./child.css" layer(shared);@master entry;@preserve native;.example{background:url("pixel.svg?q=one/../two&encoded=%20#part")}')
    writeFileSync(join(root, 'child.css'), '@import "https://external.test/style.css";.child{background:url(pixel.svg)}')
    writeFileSync(join(root, 'pixel.svg'), '<svg/>')
    await run(root)
  } finally { rmSync(root, { recursive: true, force: true }) }
}

for (const format of ['es', 'cjs'] as const) {
  test.each(['static', 'runtime'])(`BH-0004 ${format} inline applies %s URL hooks to JS and retained CSS`, async mode => {
    await fixture(async root => {
      const calls: { filename: string, hostId: string, hostType: string, ssr: boolean }[] = []
      const result = await build({ root, configFile: false, logLevel: 'silent', plugins: [masterCSS({ mode: 'static', runtime: false })], experimental: { renderBuiltUrl(filename, context) {
        calls.push({ filename, ...context })
        const url = `https://cdn.test/with space/"quoted"/${filename}`
        return mode === 'runtime' && context.hostType === 'js' ? { runtime: JSON.stringify(url) } : url
      } }, build: { ssr: join(root, 'entry.js'), ssrEmitAssets: true, minify: false, rolldownOptions: { output: { format, entryFileNames: `entry.${format === 'es' ? 'mjs' : 'cjs'}` } } } })
      if (Array.isArray(result) || 'on' in result) throw new Error('Expected one output')
      const entry = result.output.find(item => item.type === 'chunk' && item.isEntry)!
      const file = join(root, 'dist', entry.fileName)
      const { css } = format === 'cjs' ? createRequire(import.meta.url)(file) : await import(pathToFileURL(file).href)
      expect(css).toContain('https://cdn.test/with%20space/%22quoted%22/')
      expect(css).toContain('?q=one/../two&encoded=%20#part')
      expect(calls.some(call => call.ssr && call.hostType === 'js' && call.hostId === entry.fileName && call.filename.includes('.svg'))).toBe(true)
      expect(calls.some(call => call.ssr && call.hostType === 'css' && call.hostId.endsWith('.css') && call.filename.includes('.svg'))).toBe(true)
      expect(result.output.some(item => item.type === 'asset' && String(item.source).includes('https://cdn.test/with%20space/%22quoted%22/'))).toBe(true)
    })
  })
}

test('BH-0004 changing the URL hook does not reuse a filename for different CSS bytes', async () => {
  await fixture(async root => {
    const versions = []
    for (const host of ['one.test', 'two.test', 'one.test']) {
      const result = await build({ root, configFile: false, logLevel: 'silent', plugins: [masterCSS({ mode: 'static', runtime: false })], experimental: { renderBuiltUrl(filename) { return `https://${host}/${filename}` } }, build: { write: false, ssr: join(root, 'entry.js'), ssrEmitAssets: true, minify: false } })
      if (Array.isArray(result) || 'on' in result) throw new Error('Expected one output')
      versions.push(new Map(result.output.flatMap(item => item.type === 'asset' && item.fileName.endsWith('.css') ? [[item.fileName, String(item.source)] as const] : [])))
    }
    for (const [filename, source] of versions[0]) {
      if (versions[1].has(filename)) expect(versions[1].get(filename)).toBe(source)
    }
    expect(versions[2]).toEqual(versions[0])
  })
})

test('BH-0004 relative-base server and client builds agree on retained CSS assets', async () => {
  await fixture(async root => {
    writeFileSync(join(root, 'client.js'), 'import css from "./style.css?inline";window.css=css')
    const versions = []
    for (const ssr of [false, true]) {
      const result = await build({ root, base: './', configFile: false, logLevel: 'silent', plugins: [masterCSS({ mode: 'static', runtime: false })], build: { write: false, ssr: ssr ? join(root, 'entry.js') : false, ssrEmitAssets: true, minify: false, rolldownOptions: { input: ssr ? undefined : join(root, 'client.js') } } })
      if (Array.isArray(result) || 'on' in result) throw new Error('Expected one output')
      versions.push(new Map(result.output.flatMap(item => item.type === 'asset' && item.fileName.endsWith('.css') ? [[item.fileName, String(item.source)] as const] : [])))
    }
    expect(versions[1]).toEqual(versions[0])
  })
})
