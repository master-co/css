import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createServer } from 'vite'
import { expect, test, vi } from 'vitest'
import masterCSS from '../../src/core'
import { sassModuleID } from '../../src/utils/build-sass-source'
const require = createRequire(import.meta.url)
const sassDirectory = dirname(createRequire(require.resolve('vite')).resolve('sass'))

for (const mode of ['static', 'runtime', 'pre-render', 'progressive'] as const) for (const syntax of ['scss', 'sass']) for (const base of ['/', '/base/']) {
  test(`internal ${syntax} CSS proxy serves direct requests in ${mode} at ${base}`, async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-sass-proxy-direct-')))
    let server: Awaited<ReturnType<typeof createServer>> | undefined
    try {
      mkdirSync(join(root, 'node_modules'));symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
      mkdirSync(join(root, 'nested'))
      writeFileSync(join(root, 'nested/tokens.css'), '@utilities{paint{padding:2rem;background:url("./pixel.svg?v=1#icon")}}')
      writeFileSync(join(root, 'nested/pixel.svg'), '<svg xmlns="http://www.w3.org/2000/svg" data-owner="nested"/>')
      writeFileSync(join(root, `nested/child.${syntax}`), syntax === 'scss' ? '@reference "./tokens.css";.target{@compose paint;}' : '@reference "./tokens.css"\n.target\n  @compose paint\n')
      writeFileSync(join(root, 'style.module.css'), `@import "./nested/child.${syntax}" layer(owner);`)
      writeFileSync(join(root, 'entry.js'), 'import names from "./style.module.css";export default names;if(import.meta.hot)import.meta.hot.accept("./style.module.css",()=>{});')
      server = await createServer({ root, base, cacheDir: join(root, '.vite'), configFile: false, logLevel: 'silent', plugins: masterCSS({ mode, runtime: false }), server: { host: '127.0.0.1', port: 0 } })
      await server.listen()
      await server.environments.client.transformRequest('/entry.js')
      const module = await server.environments.client.transformRequest('/style.module.css')
      const path = module?.code.match(/import\s+"([^"]+\.css)"/)?.[1]
      expect(path).toBeDefined()
      const url = new URL(path!, server.resolvedUrls!.local[0])
      const collect = async (explicit: boolean) => {
        const request = new URL(url)
        if (explicit) request.searchParams.set('direct', '')
        const pending = [request], seen = new Set<string>(), css: string[] = []
        while (pending.length) {
          const current = pending.pop()!
          if (seen.has(current.href)) continue
          seen.add(current.href)
          const response = await fetch(current, { headers: { accept: 'text/css' } }), text = await response.text()
          expect(response.status, text).toBe(200)
          expect(response.headers.get('content-type')).toContain('text/css')
          css.push(text)
          for (const match of text.matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]/g)) pending.push(new URL(match[1], current))
          for (const match of text.matchAll(/url\(['"]?([^'"\)]+\.svg[^'"\)]*)['"]?\)/g)) {
            const resource = new URL(match[1], current), fetched = await fetch(resource)
            expect(fetched.status).toBe(200)
            expect(fetched.headers.get('content-type')).toContain('image/svg+xml')
            expect(await fetched.text()).toContain('data-owner="nested"')
            expect(resource.search).toBe('?v=1');expect(resource.hash).toBe('#icon')
          }
        }
        return css.join('\n')
      }
      for (const direct of [false, true]) {
        const text = await collect(direct)
        expect(text).toMatch(/padding:\s*2rem/)
        expect(text).not.toMatch(/@compose|@reference|__vite__css/)
      }
      const loaded = await server.ssrLoadModule('/entry.js')
      expect(Object.keys(loaded.default)).toEqual(['target'])
      writeFileSync(join(root, 'nested/tokens.css'), '@utilities{paint{padding:7rem;background:url("./pixel.svg?v=1#icon")}}')
      await vi.waitFor(async () => expect(await collect(true)).toMatch(/padding:\s*7rem/), { timeout: 5000 })
    } finally { await server?.environments.client.waitForRequestsIdle();await server?.close();rmSync(root, { recursive: true, force: true }) }
  })
}

for (const access of ['allowed', 'outside-denied', 'pattern-denied'] as const) test(`proxy requests retain host file access policy: ${access}`, async () => {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'master-proxy-access-'))), root = join(parent, 'app'), outside = join(parent, 'outside')
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  try {
    mkdirSync(root);mkdirSync(outside)
    const owner = join(access === 'pattern-denied' ? root : outside, 'secret file.css')
    writeFileSync(owner, '.outside{padding:9rem}')
    server = await createServer({ root, base: '/base/', configFile: false, logLevel: 'silent', plugins: masterCSS({ mode: 'static', runtime: false }),
      server: { host: '127.0.0.1', port: 0, fs: { strict: true, allow: access === 'allowed' ? [root, outside] : [root], ...(access === 'pattern-denied' ? { deny: ['**/secret file.css'] } : {}) } }
    })
    await server.listen()
    const paths = ['', '.master-css-sass.css'].map(suffix => `/base/@fs${owner}${suffix}?direct`)
    if (access !== 'allowed') paths.push('/base/@id/__x00__' + sassModuleID(owner).slice(1))
    for (const path of paths) {
      const url = new URL(path, server.resolvedUrls!.local[0])
      const response = await fetch(url, { headers: { accept: 'text/css' } }), text = await response.text()
      if (access === 'allowed') { expect(response.status, text).toBe(200);expect(text).toContain('padding:9rem') }
      else { expect(response.status, text).toBe(403);expect(text).not.toContain('padding:9rem') }
    }
  } finally { await server?.environments.client.waitForRequestsIdle();await server?.close();rmSync(parent, { recursive: true, force: true }) }
})
