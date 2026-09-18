import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { build, createServer } from 'vite'
import { expect, test, vi } from 'vitest'
import masterCSS from '../../src/core'
import { watchDeadline } from '../watch-deadline-helper'

const require = createRequire(import.meta.url)
const sassDirectory = dirname(createRequire(require.resolve('vite')).resolve('sass'))

for (const mode of ['static', 'runtime', 'pre-render', 'progressive'] as const) for (const syntax of ['scss', 'sass']) test.each(['build', 'serve'])('BH-0004 retained ' + syntax + ' references keep child owners in ' + mode + '/%s', async command => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-retained-reference-')))
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  try {
    mkdirSync(join(root, 'node_modules')); symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
    const imports: string[] = []
    for (const [index, side] of ['a', 'b'].entries()) {
      mkdirSync(join(root, side))
      writeFileSync(join(root, side, 'tokens.css'), `@utilities{paint-${side}{padding:${index + 2}rem;background:url("./pixel.svg?v=${side}#icon")}}.never-${side}{color:red}`)
      writeFileSync(join(root, side, 'pixel.svg'), `<svg xmlns="http://www.w3.org/2000/svg" data-owner="${side}"/>`)
      writeFileSync(join(root, side, `child.${syntax}`), syntax === 'scss'
        ? `@reference "./tokens.css"; .${side}{@compose paint-${side};}`
        : `@reference "./tokens.css"\n.${side}\n  @compose paint-${side}\n`)
      imports.push(`@import "./${side}/child.${syntax}" layer(owner-${side});`)
    }
    writeFileSync(join(root, 'tokens.css'), '@utilities{paint-a{padding:99rem}paint-b{padding:99rem}}')
    writeFileSync(join(root, 'style.module.css'), imports.join('\n'))
    writeFileSync(join(root, 'entry.js'), 'import styles from "./style.module.css"; globalThis.referenceClasses = styles; export default styles; if(import.meta.hot) import.meta.hot.accept("./style.module.css", next => { globalThis.referenceClasses = next.default });')
    writeFileSync(join(root, 'index.html'), '<script type="module" src="./entry.js"></script>')
    const config = { root, cacheDir: join(root, '.vite'), configFile: false as const, logLevel: 'silent' as const, plugins: masterCSS({ mode, runtime: false }) }
    const sources: string[] = []
    let collect: (() => Promise<string[]>) | undefined
    if (command === 'build') {
      const result = await build({ ...config, build: { write: false, minify: false, assetsInlineLimit: 0 } })
      for (const output of Array.isArray(result) ? result : [result]) {
        if (!('output' in output)) throw new Error('Unexpected watch output')
        for (const asset of output.output) if (asset.type === 'asset') sources.push(String(asset.source))
      }
    } else {
      server = await createServer({ ...config, server: { host: '127.0.0.1', port: 0 } })
      await server.listen()
      const origin = server.resolvedUrls!.local[0]
      await server.transformRequest('/entry.js')
      const module = await server.transformRequest('/style.module.css')
      const stylesheet = module?.code.match(/import\s+"([^"]+\.css)"/)?.[1]
      expect(stylesheet).toBeDefined()
      collect = async () => {
        const values: string[] = [], pending = [new URL(stylesheet!, origin).href], seen = new Set<string>()
        while (pending.length) {
          const url = pending.pop()!
          if (seen.has(url)) continue
          seen.add(url)
          const response = await fetch(url), body = await response.text()
          expect(response.status, body).toBe(200)
          const jsCSS = body.match(/const __vite__css = ("(?:[^"\\]|\\.)*")/)
          const text = jsCSS ? JSON.parse(jsCSS[1]) as string : body
          expect(response.headers.get('content-type')).toContain(jsCSS ? 'javascript' : 'text/css')
          values.push(text)
          for (const match of text.matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]/g)) pending.push(new URL(match[1], url).href)
          for (const match of text.matchAll(/url\(['"]?([^'"\)]+\.svg[^'"\)]*)['"]?\)/g)) {
            const resource = await fetch(new URL(match[1], url))
            expect(resource.status).toBe(200)
            expect(resource.headers.get('content-type')).toContain('image/svg+xml')
            values.push(await resource.text())
          }
        }
        return values
      }
      sources.push(...await collect())
      const loaded = await server.ssrLoadModule('/entry.js')
      expect(Object.keys(loaded.default).sort()).toEqual(['a', 'b'])
    }
    const text = sources.join('\n')
    expect(text).toMatch(/padding:\s*2rem/)
    expect(text).toMatch(/padding:\s*3rem/)
    expect(text).not.toMatch(/99rem|never-|@reference|@compose/)
    for (const side of ['a', 'b']) {
      expect(text).toMatch(new RegExp(`(?:layer\\(owner-${side}\\)|@layer owner-${side}\\s*\\{)`))
      expect(text).toContain(`data-owner="${side}"`)
      expect(text).toContain(`?v=${side}#icon`)
    }
    if (server && collect) {
      const send = vi.spyOn(server.ws, 'send')
      writeFileSync(join(root, 'a/tokens.css'), '@utilities{paint-a{padding:7rem;background:url("./pixel.svg?v=a#icon")}}.never-a{color:red}')
      await vi.waitFor(() => expect(send).toHaveBeenCalledWith(expect.objectContaining({ type: 'update' })), { timeout: watchDeadline })
      await vi.waitFor(async () => expect((await collect!()).join('\n')).toMatch(/padding:\s*7rem/), { timeout: watchDeadline })
      send.mockClear()
      writeFileSync(join(root, 'a/pixel.svg'), '<svg xmlns="http://www.w3.org/2000/svg" data-owner="a-updated"/>')
      await vi.waitFor(() => expect(send).toHaveBeenCalledWith(expect.objectContaining({ type: 'update' })), { timeout: watchDeadline })
      await vi.waitFor(async () => expect((await collect!()).join('\n')).toContain('data-owner="a-updated"'), { timeout: watchDeadline })
    }
  } finally {
    await server?.environments.client.waitForRequestsIdle()
    await server?.close()
    rmSync(root, { recursive: true, force: true })
  }
})
