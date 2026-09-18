import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createServer } from 'vite'
import { expect, test } from 'vitest'
import masterCSS from '../../src/core'

test.each(['static', 'runtime', 'pre-render', 'progressive'] as const)('identical imported files retain module scope and distinct resource owners in %s', async mode => {
  const parent = join(process.cwd(), 'tmp'); mkdirSync(parent, { recursive: true })
  const root = mkdtempSync(join(parent, 'module-duplicate-inputs-'))
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  try {
    for (const name of ['a', 'b']) {
      mkdirSync(join(root, name))
      writeFileSync(join(root, name, 'child.css'), '.same{@compose p:2rem;background:url("./pixel.svg")}')
      writeFileSync(join(root, name, 'pixel.svg'), `<svg xmlns="http://www.w3.org/2000/svg"><title>${name}</title></svg>`)
    }
    writeFileSync(join(root, 'style.module.css'), '@import "./a/child.css" layer(guard);@import "./b/child.css" layer(guard);.local{display:block}:export{token:shared}')
    writeFileSync(join(root, 'entry.js'), 'export {default as names} from "./style.module.css";export {default as css} from "./style.module.css?inline";')
    server = await createServer({ root, cacheDir: join(root, '.vite'), configFile: false, logLevel: 'silent', plugins: masterCSS({ mode }), css: { modules: { generateScopedName: 'scope_[local]' } }, server: { host: '127.0.0.1', port: 0 } })
    await server.listen()
    const result = await server.ssrLoadModule('/entry.js')
    expect(result.names).toMatchObject({ same: 'scope_same', local: 'scope_local', token: 'shared' })
    const sources = [result.css as string], seen = new Set<string>()
    for (const css of sources) for (const match of css.matchAll(/@import\s+"([^"]+)"/g)) {
      if (seen.has(match[1])) continue
      seen.add(match[1])
      const response = await fetch(new URL(match[1], server.resolvedUrls!.local[0]))
      expect(response.status).toBe(200); sources.push(await response.text())
    }
    const css = sources.join('\n')
    expect(css).not.toMatch(/\.same\s*\{/)
    expect(css.match(/\.scope_same\s*\{/g)).toHaveLength(2)
    expect(css).not.toContain(':export')
    const assets = new Set<string>()
    for (const match of css.matchAll(/url\("([^"]+)"\)/g)) {
      const response = await fetch(new URL(match[1], server.resolvedUrls!.local[0]))
      expect(response.status).toBe(200); assets.add(await response.text())
    }
    expect([...assets].sort()).toEqual(['a', 'b'].map(name => `<svg xmlns="http://www.w3.org/2000/svg"><title>${name}</title></svg>`))
  } finally {
    await server?.environments.client.waitForRequestsIdle(); await server?.close()
    rmSync(root, { recursive: true, force: true })
  }
})
