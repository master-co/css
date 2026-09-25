import { resolveOptions } from '../src/options'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { expect, test, vi } from 'vitest'
import { addStaticCSSDependencies, prepareNextStatic, transformStaticStyleSource, writeStaticState, readStaticState } from '../src/static'
import staticLoader from '../src/static-css-loader'

async function cleanup(root: string) {
  const sessions = globalThis.__MASTER_CSS_NEXT_STATIC_SESSIONS__
  if (sessions) for (const [key, session] of sessions) if (key.startsWith(root + '\0')) {
    await session.scanner.dispose()
    session.stylesheets.dispose()
    sessions.delete(key)
  }
  rmSync(root, { recursive: true, force: true })
}

function readCSSGraph(entry: string, seen = new Set<string>()): string {
  if (seen.has(entry)) return ''
  seen.add(entry)
  const css = readFileSync(entry, 'utf8')
  const imports = [...css.matchAll(/@import\s+["']([^"']+)["']/g)].filter(([, href]) => href.startsWith('.'))
  return css + imports.map(([, href]) => readCSSGraph(fileURLToPath(new URL(href, pathToFileURL(entry))), seen)).join('\n')
}

function resourceURLs(file: string) {
  const css = readFileSync(file, 'utf8')
  return [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(([, href]) => ({ href,
    file: fileURLToPath(new URL(href, pathToFileURL(file))) }))
}

for (const nested of [false, true]) test(`static publication delivers resource owners and fresh immutable bytes: nested=${nested}`, async () => {
  const root = mkdtempSync(join(tmpdir(), 'next-static-publish-'))
  try {
    const app = join(root, 'app'), owner = nested ? join(app, 'nested') : app
    mkdirSync(join(owner, 'assets'), { recursive: true })
    const image = join(owner, 'assets/pixel space.svg'), entry = join(app, 'globals.css')
    const red = '<svg xmlns="http://www.w3.org/2000/svg" id="red"/>', blue = red.replace('red', 'blue')
    writeFileSync(image, red)
    const native = '.probe{background-image:url("./assets/pixel%20space.svg?audit=1#pixel")} '
    writeFileSync(join(owner, 'child.css'), native)
    const source = '@master entry;@preserve native;' + (nested ? '@import "./nested/child.css" layer(card);' : native)
    writeFileSync(entry, source)
    const state = (await prepareNextStatic({ mode: 'static' }, { projectDir: root }))!
    const original = readFileSync(state.outputPath, 'utf8')
    const cssFiles = () => readdirSync(dirname(state.outputPath)).filter(file => file.endsWith('.css')).map(file => join(dirname(state.outputPath), file))
    const before = cssFiles().flatMap(resourceURLs)
    expect(before.length).toBeGreaterThan(0)
    for (const resource of before) {
      expect(resource.href).toContain('?audit=1#pixel')
      expect(readFileSync(resource.file, 'utf8')).toBe(red)
    }
    const dependencies: string[] = []
    await addStaticCSSDependencies(state.statePath, file => dependencies.push(file))
    expect(dependencies).toContain(image)
    rmSync(image)
    await expect(transformStaticStyleSource(state.statePath, entry, source)).rejects.toThrow()
    expect(readFileSync(state.outputPath, 'utf8')).toBe(original)
    writeFileSync(image, blue)
    await transformStaticStyleSource(state.statePath, entry, source)
    const current = readFileSync(state.outputPath, 'utf8')
    expect(current).not.toBe(original)
    const fresh = cssFiles().flatMap(resourceURLs).filter(resource => readFileSync(resource.file, 'utf8') === blue)
    expect(fresh.length).toBeGreaterThan(0)
    // Earlier immutable references remain usable by in-flight host consumers.
    for (const resource of before) expect(readFileSync(resource.file, 'utf8')).toBe(red)
  } finally { await cleanup(root) }
})

test('static preparation rejects output failures and retries after the failure is removed', async () => {
  const root = mkdtempSync(join(tmpdir(), 'next-static-write-failure-'))
  try {
    mkdirSync(join(root, 'app'))
    writeFileSync(join(root, 'app/globals.css'), '@master entry;@preserve native;.probe{color:red}')
    mkdirSync(join(root, '.master/next.css'), { recursive: true })
    await expect(prepareNextStatic({ mode: 'static' }, { projectDir: root })).rejects.toThrow()
    rmSync(join(root, '.master/next.css'), { recursive: true })
    const state = (await prepareNextStatic({ mode: 'static' }, { projectDir: root }))!
    expect(readCSSGraph(state.outputPath)).toMatch(/color\s*:\s*red/)
    const entry = join(root, 'app/globals.css'), source = readFileSync(entry, 'utf8')
    rmSync(state.outputPath)
    mkdirSync(state.outputPath)
    await expect(transformStaticStyleSource(state.statePath, entry, source)).rejects.toThrow()
    rmSync(state.outputPath, { recursive: true })
    await transformStaticStyleSource(state.statePath, entry, source)
    expect(readCSSGraph(state.outputPath)).toMatch(/color\s*:\s*red/)
  } finally { await cleanup(root) }
})

test('static CSS loader reports newly discovered resource dependencies in the same invocation', async () => {
  const root = mkdtempSync(join(tmpdir(), 'next-static-new-dependency-'))
  try {
    const app = join(root, 'app'), entry = join(app, 'globals.css'), image = join(app, 'new.svg')
    mkdirSync(app)
    writeFileSync(entry, '@master entry;')
    const state = (await prepareNextStatic({ mode: 'static' }, { projectDir: root }))!
    const source = '@master entry;@preserve native;.probe{background-image:url("./new.svg")}'
    writeFileSync(image, '<svg xmlns="http://www.w3.org/2000/svg"/>')
    writeFileSync(entry, source)
    const dependencies: string[] = []
    await new Promise((resolve, reject) => staticLoader.call({ resourcePath: entry,
      addDependency: file => dependencies.push(file), getOptions: () => ({ statePath: state.statePath }),
      async: () => (error, content) => error ? reject(error) : resolve(content)
    }, source))
    expect(dependencies).toContain(image)
    expect(dependencies.some(file => dirname(file) === dirname(state.outputPath) && file.endsWith('.css') && file !== state.outputPath)).toBe(false)
    const outputFiles = readdirSync(dirname(state.outputPath)).filter(file => file.endsWith('.svg'))
    for (const file of outputFiles) expect(dependencies).not.toContain(join(dirname(state.outputPath), file))
  } finally { await cleanup(root) }
})

test('a configuration change during composition rejects the older publisher', async () => {
  const root = mkdtempSync(join(tmpdir(), 'next-static-config-race-'))
  try {
    mkdirSync(join(root, 'app'))
    writeFileSync(join(root, 'app/globals.css'), '@master entry;')
    writeFileSync(join(root, 'app/page.tsx'), '<main className="p:19px" />')
    const state = (await prepareNextStatic({}, { projectDir: root }))!
    const previous = readFileSync(state.outputPath, 'utf8')
    const session = [...globalThis.__MASTER_CSS_NEXT_STATIC_SESSIONS__!.entries()].find(([key]) => key.startsWith(root + '\0'))![1]
    const compose = session.stylesheets.compose.bind(session.stylesheets)
    const next = resolveOptions({ mode: 'static', scanner: { ...readStaticState(state.statePath).options.scanner, blocklist: ['p:19px'] } })
    const spy = vi.spyOn(session.stylesheets, 'compose').mockImplementationOnce(async options => {
      const result = await compose(options)
      await writeStaticState(root, state.outputPath, state.statePath, state.scanLogPath, next)
      return result
    })
    await expect(session.write()).rejects.toThrow('configuration changed')
    expect(readFileSync(state.outputPath, 'utf8')).toBe(previous)
    spy.mockRestore()
    await prepareNextStatic(next, { projectDir: root })
    expect(readCSSGraph(state.outputPath)).not.toContain('padding:19px')
  } finally { await cleanup(root) }
})
