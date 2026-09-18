import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { build, createServer } from 'vite'
import { expect, test } from 'vitest'
import masterCSS from '../../src/core'

for (const command of ['serve', 'build'] as const) {
  test.each(['static', 'runtime', 'pre-render', 'progressive'] as const)(`local graph keeps CSS Modules exports and inline output in ${command}/%s`, async mode => {
    const parent = join(process.cwd(), 'tmp'); mkdirSync(parent, { recursive: true })
    const root = mkdtempSync(join(parent, 'local-graph-requests-'))
    let server: Awaited<ReturnType<typeof createServer>> | undefined
    try {
      writeFileSync(join(root, 'style.module.css'), '@import "./child.css" layer(guard);.local{@compose inline-flex;}')
      writeFileSync(join(root, 'child.css'), '@import "https://external.test/style.css";.child{@compose p:2rem;}')
      writeFileSync(join(root, 'server.js'), 'export {default as names} from "./style.module.css";export {default as css} from "./style.module.css?inline";export {default as raw} from "./style.module.css?raw";')
      writeFileSync(join(root, 'client.js'), 'import {names,css,raw} from "./server.js";console.log(names.local,css,raw)')
      writeFileSync(join(root, 'index.html'), '<script type="module" src="./client.js"></script>')
      const config = { root, configFile: false as const, logLevel: 'silent' as const, plugins: masterCSS({ mode }), css: { modules: { generateScopedName: 'scoped_[local]' } } }
      if (command === 'serve') {
        server = await createServer({ ...config, server: { host: '127.0.0.1', port: 0 } }); await server.listen()
        const result = await server.ssrLoadModule('/server.js')
        expect(result.names.local).toBe('scoped_local')
        expect(result.raw).toBe(readFileSync(join(root, 'style.module.css'), 'utf8'))
        const sources = [result.css as string], seen = new Set<string>()
        for (const source of sources) {
          for (const match of source.matchAll(/@import\s+"([^"]+)"/g)) {
            if (match[1].includes('external.test') || seen.has(match[1])) continue
            seen.add(match[1])
            const response = await fetch(new URL(match[1], server.resolvedUrls!.local[0]))
            expect(response.status).toBe(200); sources.push(await response.text())
          }
        }
        expect(sources.join('\n')).toContain('.scoped_local')
        expect(sources.join('\n')).toContain('padding:2rem')
        expect(sources.join('\n')).not.toContain('@compose')
      } else {
        const result = await build({ ...config, build: { write: false, minify: false, cssMinify: false } })
        if (Array.isArray(result) || 'on' in result) throw new Error('Expected one build output')
        const css = result.output.filter(asset => asset.type === 'asset' && asset.fileName.endsWith('.css')).map(asset => asset.type === 'asset' ? String(asset.source) : '').join('\n')
        const js = result.output.filter(asset => asset.type === 'chunk').map(asset => asset.code).join('\n')
        expect(css).toContain('.scoped_local')
        expect(css).toContain('padding:2rem')
        expect(css).not.toContain('@compose')
        expect(css).not.toContain('#master-css-local-')
        expect(js).toContain('scoped_local')
        expect(js).not.toMatch(/["']__MASTER_CSS_INLINE_[a-f\d]+__["']/)
        expect(js).not.toContain('master-css-inline.invalid')
      }
    } finally {
      await server?.environments.client.waitForRequestsIdle(); await server?.close()
      rmSync(root, { recursive: true, force: true })
    }
  })
}
