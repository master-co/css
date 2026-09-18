import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { build, createServer } from 'vite'
import { expect, test } from 'vitest'
import masterCSS from '../../src/core'

for (const command of ['serve', 'build'] as const) {
  for (const rootCompose of [false, true]) {
    for (const composeChild of [false, true]) {
      test.each(['static', 'runtime', 'pre-render', 'progressive'] as const)(`BH-0004 local compose retains qualified child imports in ${command}/root-compose=${rootCompose}/child-compose=${composeChild}/%s`, async mode => {
        const parent = join(process.cwd(), 'tmp')
        mkdirSync(parent, { recursive: true })
        const root = mkdtempSync(join(parent, 'local-compose-graph-'))
        let server: Awaited<ReturnType<typeof createServer>> | undefined
        try {
          writeFileSync(join(root, 'index.html'), '<!doctype html><div class="local child"></div><script type="module" src="./client.js"></script>')
          writeFileSync(join(root, 'client.js'), 'import "./local.css"')
          writeFileSync(join(root, 'local.css'), `@import "./child.css" layer(guard) supports(display:grid) screen and (min-width:700px);.local{${rootCompose ? '@compose block;' : 'display:block'}}`)
          writeFileSync(join(root, 'child.css'), `@import "https://example.invalid/external.css";.child{${composeChild ? '@compose p:2rem;' : ''}color:red}`)
          const config = { root, configFile: false as const, logLevel: 'silent' as const, plugins: masterCSS({ mode }) }
          const sources: string[] = []
          if (command === 'serve') {
            server = await createServer({ ...config, server: { host: '127.0.0.1', port: 0 } })
            await server.listen()
            const pending = [new URL('local.css?direct', server.resolvedUrls!.local[0]).href], seen = new Set<string>()
            while (pending.length) {
              const url = pending.pop()!
              if (seen.has(url)) continue
              seen.add(url)
              const response = await fetch(url), source = await response.text()
              expect(response.status, source).toBe(200)
              expect(response.headers.get('content-type')).toContain('text/css')
              sources.push(source)
              for (const match of source.matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]/g)) {
                if (!match[1].includes('example.invalid')) pending.push(new URL(match[1], url).href)
              }
            }
          } else {
            await build({ ...config, build: { minify: false, cssMinify: false } })
            for (const file of readdirSync(join(root, 'dist'), { recursive: true })) {
              if (typeof file === 'string' && file.endsWith('.css')) sources.push(readFileSync(join(root, 'dist', file), 'utf8'))
            }
          }
          const css = sources.join('\n')
          expect(css).toContain('https://example.invalid/external.css')
          expect(css).toMatch(/@import[^;]+layer\(guard\)[^;]+supports\(display:\s*grid\)/)
          expect(css).toMatch(/(?:min-width:\s*700px|width\s*>=\s*700px)/)
          expect(css).toMatch(/display:\s*block/)
          expect(css).toMatch(/color:\s*red/)
          if (composeChild) expect(css).toMatch(/padding:\s*2rem/)
          expect(css).not.toContain('@compose')
        } finally {
          await server?.environments.client.waitForRequestsIdle()
          await server?.close()
          rmSync(root, { recursive: true, force: true })
        }
      })
    }
  }
}
