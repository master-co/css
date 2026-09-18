import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { build, createServer } from 'vite'
import { expect, test } from 'vitest'
import masterCSS from '../../src/core'

for (const command of ['serve', 'build'] as const) {
  for (const query of ['url', 'theme=dark']) {
    test.each(['static', 'runtime', 'pre-render', 'progressive'] as const)(`local imported directives survive ${command}/?${query}/%s`, async mode => {
      const parent = join(process.cwd(), 'tmp'); mkdirSync(parent, { recursive: true })
      const root = mkdtempSync(join(parent, 'local-query-graph-'))
      let server: Awaited<ReturnType<typeof createServer>> | undefined
      try {
        writeFileSync(join(root, 'style.css'), '@import "./bridge.css" layer(guard) supports(display:grid) screen and (min-width:700px);.local{display:inline-flex}')
        writeFileSync(join(root, 'bridge.css'), '@import "./child.css";.bridge{display:block}')
        writeFileSync(join(root, 'child.css'), '@import "https://external.test/style.css";.child{@compose p:2rem;}')
        const module = query === 'url' ? 'export {default as url} from "./style.css?url";' : 'import "./style.css?theme=dark";export const url="/style.css?theme=dark";'
        writeFileSync(join(root, 'server.js'), module)
        writeFileSync(join(root, 'client.js'), 'import {url} from "./server.js";console.log(url)')
        writeFileSync(join(root, 'index.html'), '<script type="module" src="./client.js"></script>')
        const config = { root, configFile: false as const, logLevel: 'silent' as const, plugins: masterCSS({ mode }) }
        let css: string
        if (command === 'serve') {
          server = await createServer({ ...config, server: { host: '127.0.0.1', port: 0 } }); await server.listen()
          const result = await server.ssrLoadModule('/server.js')
          const sources: string[] = [], seen = new Set<string>()
          const urls = [new URL(result.url, server.resolvedUrls!.local[0]).href]
          for (const url of urls) {
            if (seen.has(url)) continue
            seen.add(url)
            const response = await fetch(url, { headers: { accept: 'text/css' } })
            expect(response.status).toBe(200)
            const source = await response.text(); sources.push(source)
            for (const match of source.matchAll(/@import\s+"([^"]+)"/g)) {
              if (!match[1].includes('external.test')) urls.push(new URL(match[1], url).href)
            }
          }
          css = sources.join('\n')
        } else {
          const result = await build({ ...config, build: { write: false, minify: false, cssMinify: false } })
          if (Array.isArray(result) || 'on' in result) throw new Error('Expected one build output')
          css = result.output.filter(asset => asset.type === 'asset' && asset.fileName.endsWith('.css')).map(asset => asset.type === 'asset' ? String(asset.source) : '').join('\n')
        }
        expect(css).toContain('padding:2rem')
        expect(css).toContain('inline-flex')
        expect(css).toContain('external.test/style.css')
        expect(css).toMatch(/(?:min-width:\s*700px|width\s*>=\s*700px)/)
        expect(css).not.toContain('@compose')
        expect(css).not.toContain('#master-css-local-')
      } finally {
        await server?.environments.client.waitForRequestsIdle(); await server?.close()
        rmSync(root, { recursive: true, force: true })
      }
    })
  }
}
