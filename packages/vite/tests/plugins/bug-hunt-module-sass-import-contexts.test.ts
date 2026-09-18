import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { createServer } from 'vite'
import { expect, test } from 'vitest'
import MagicString from 'magic-string'
import masterCSS from '../../src/core'

const require = createRequire(import.meta.url)
const sassDirectory = dirname(createRequire(require.resolve('vite')).resolve('sass'))
const cases = (['static', 'runtime', 'pre-render', 'progressive'] as const).flatMap(mode => ['css', 'scss'].flatMap(extension => ['scss', 'sass'].flatMap(syntax => (['expanded', 'compressed'] as const).map(style => ({ mode, extension, syntax, style })))))
test.each(cases)('equal Sass outputs retain root scope and resource owners in $mode / $extension / $syntax / $style', async ({ mode, extension, syntax, style }) => {
  const parent = join(process.cwd(), 'tmp'); mkdirSync(parent, { recursive: true })
  const root = mkdtempSync(join(parent, 'module-sass-import-contexts-'))
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  try {
    mkdirSync(join(root, 'node_modules'));symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
    const calls: string[] = [], inputs = new Map<string, string>(), original = new Map<string, string>()
    const additionalData = async (source: string, file: string) => {
      calls.push(file);inputs.set(file, source)
      if (style === 'expanded') return source
      const edited = new MagicString(source).prepend('// User prefix\n')
      return { content: edited.toString(), map: edited.generateMap({ hires: 'boundary', source: file, file, includeContent: true }) }
    }
    for (const name of ['a', 'b']) {
      mkdirSync(join(root, name))
      const file = join(root, name, `child.${syntax}`)
      const source = syntax === 'scss' ? `$${name}:2rem;.same{@compose p:#{$${name}};background:url("./pixel.svg")}` : `$${name}: 2rem\n.same\n  @compose p:#{$${name}}\n  background: url("./pixel.svg")\n`
      original.set(file, source);writeFileSync(file, source)
      writeFileSync(join(root, name, 'pixel.svg'), `<svg xmlns="http://www.w3.org/2000/svg"><title>${name}</title></svg>`)
    }
    writeFileSync(join(root, `style.module.${extension}`), `@import "./a/child.${syntax}" layer(guard);@import "./b/child.${syntax}" layer(guard);.local{display:block}:export{token:shared}`)
    writeFileSync(join(root, 'entry.js'), `export {default as names} from "./style.module.${extension}";export {default as css} from "./style.module.${extension}?inline";`)
    server = await createServer({ root, cacheDir: join(root, '.vite'), configFile: false, logLevel: 'silent', plugins: masterCSS({ mode }), css: { modules: { generateScopedName: 'scope_[local]' }, preprocessorOptions: { scss: { style, additionalData }, sass: { style, additionalData } } }, server: { host: '127.0.0.1', port: 0 } })
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
    for (const name of ['a', 'b']) expect.soft(calls.filter(file => file === join(root, name, `child.${syntax}`))).toHaveLength(1)
    expect.soft(css).not.toMatch(/\.same\s*\{/)
    expect.soft(css.match(/\.scope_same\s*\{/g)).toHaveLength(2)
    expect(css).not.toContain(':export')
    expect(css).not.toContain('master-css:module-input-')
    for (const [file, source] of original) expect(inputs.get(file)).toBe(source)
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
