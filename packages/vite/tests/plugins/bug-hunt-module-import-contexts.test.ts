import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { createServer } from 'vite'
import { expect, test, vi } from 'vitest'
import masterCSS from '../../src/core'

test.each(['static', 'runtime', 'pre-render', 'progressive'] as const)('shared imported CSS keeps two root module scopes, resources and HMR in %s', async mode => {
  const parent = join(process.cwd(), 'tmp'); mkdirSync(parent, { recursive: true })
  const root = mkdtempSync(join(parent, 'module-import-contexts-'))
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  try {
    mkdirSync(join(root, 'shared'))
    const child = (padding: string) => `@import "./grand.css";.child{@compose p:${padding};background:url("./pixel.svg?v=1#part");animation:spin 1s}:global(.global){color:blue}@keyframes spin{to{opacity:.5}}`
    writeFileSync(join(root, 'shared/child.css'), child('2rem'))
    writeFileSync(join(root, 'shared/grand.css'), '.grand{border-left:1px solid red}')
    writeFileSync(join(root, 'shared/pixel.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>')
    const source = '@import "./shared/child.css" layer(guard) supports(display:grid);.local{display:inline-flex}'
    for (const name of ['a', 'b']) writeFileSync(join(root, `${name}.module.css`), source)
    writeFileSync(join(root, 'entry.js'), 'export {default as a} from "./a.module.css";export {default as b} from "./b.module.css";export {default as cssA} from "./a.module.css?inline";export {default as cssB} from "./b.module.css?inline";')
    const calls: { file: string, css: string }[] = []
    server = await createServer({ root, cacheDir: join(root, '.vite'), configFile: false, logLevel: 'silent', plugins: masterCSS({ mode }), css: { modules: { generateScopedName(name, file, css) { calls.push({ file, css }); return basename(file).replaceAll('.', '_') + '_' + name } } }, server: { host: '127.0.0.1', port: 0 } })
    await server.listen()
    const collect = async (source: string) => {
      const sources = [source], seen = new Set<string>()
      for (const css of sources) for (const match of css.matchAll(/@import\s+"([^"]+)"/g)) {
        if (seen.has(match[1])) continue
        seen.add(match[1])
        const response = await fetch(new URL(match[1], server!.resolvedUrls!.local[0]))
        expect(response.status).toBe(200); sources.push(await response.text())
      }
      return sources.join('\n')
    }
    const initial = await server.ssrLoadModule('/entry.js')
    for (const name of ['a', 'b']) {
      const prefix = `${name}_module_css_`
      expect(initial[name]).toMatchObject({ child: prefix + 'child', grand: prefix + 'grand', spin: prefix + 'spin', local: prefix + 'local' })
      const css = await collect(initial[name === 'a' ? 'cssA' : 'cssB'])
      expect(css).toContain(`.${prefix}child`)
      expect(css).toContain(`@keyframes ${prefix}spin`)
      expect(css).toContain('.global')
      expect(css).toContain('padding:2rem')
      expect(css).toContain('?v=1#part')
      expect(css).not.toContain(name === 'a' ? 'b_module_css_' : 'a_module_css_')
    }
    expect(calls.filter(call => call.file.endsWith('.module.css')).every(call => call.css === source)).toBe(true)
    writeFileSync(join(root, 'shared/child.css'), child('3rem'))
    await vi.waitFor(async () => {
      const updated = await server!.ssrLoadModule('/entry.js')
      expect(await collect(updated.cssA)).toContain('padding:3rem')
      expect(await collect(updated.cssB)).toContain('padding:3rem')
    }, { timeout: 5000 })
  } finally {
    await server?.environments.client.waitForRequestsIdle(); await server?.close()
    rmSync(root, { recursive: true, force: true })
  }
})
