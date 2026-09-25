import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { expect, test, vi } from 'vitest'
import { prepareNextStatic, scanStaticModule } from '../src/static'

async function cssGraph(entry: string, seen = new Set<string>()): Promise<string> {
  if (seen.has(entry)) return ''
  seen.add(entry)
  const css = await readFile(entry, 'utf8')
  let result = css
  for (const [, href] of css.matchAll(/@import\s+["']([^"']+)["']/g)) {
    if (href.startsWith('.')) result += await cssGraph(fileURLToPath(new URL(href, pathToFileURL(entry))), seen)
  }
  return result
}

async function dispose(root: string) {
  for (const [key, session] of globalThis.__MASTER_CSS_NEXT_STATIC_SESSIONS__ ?? []) {
    if (!key.startsWith(root + '\0')) continue
    await session.scanner.dispose()
    session.stylesheets.dispose()
    globalThis.__MASTER_CSS_NEXT_STATIC_SESSIONS__!.delete(key)
  }
}

test('independent static workers publish the full current source set across edits and failures', async () => {
  const root = await mkdtemp(join(tmpdir(), 'next-complete-snapshot-'))
  const entry = join(root, 'app.css'), first = join(root, 'first.tsx'), second = join(root, 'second.mdx')
  try {
    await writeFile(entry, '@master entry;')
    await writeFile(first, '<div className="p:19px"/>')
    await writeFile(second, '`p:98px`\n\n<div className="m:23px"/>')
    await mkdir(join(root, 'custom-output'))
    await writeFile(join(root, 'custom-output/generated.js'), '"p:99px"')
    const options = { scanner: { blocklist: [/^p:99px$/i] } }
    const setup = { projectDir: root, distDir: 'custom-output' }
    const state = (await prepareNextStatic(options, setup))!
    const initial = await cssGraph(state.outputPath)
    expect(initial).toContain('padding:19px')
    expect(initial).toContain('margin:23px')
    expect(initial).not.toMatch(/padding:(?:98|99)px/)
    const worker = (source: string) => new Promise<void>((resolve, reject) => {
      const module = new URL('../src/static.ts', import.meta.url).href
      const script = `import {scanStaticModule} from ${JSON.stringify(module)}; await scanStaticModule(${JSON.stringify(state.statePath)}, ${JSON.stringify(source)}, '"p:97px"');`
      const child = spawn(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], { stdio: ['ignore', 'pipe', 'pipe'] })
      let errors = ''
      child.stderr.on('data', chunk => { errors += chunk })
      child.on('error', reject)
      child.on('exit', code => code === 0 ? resolve() : reject(new Error(errors)))
    })
    await Promise.all([worker(first), worker(second), worker(first)])
    expect(await cssGraph(state.outputPath)).toBe(initial)
    const unchanged = (await stat(state.outputPath)).mtimeMs
    await worker(first)
    expect((await stat(state.outputPath)).mtimeMs).toBe(unchanged)
    await writeFile(first, '')
    await rename(second, join(root, 'renamed.mdx'))
    await writeFile(join(root, '.gitignore'), 'ignored.tsx\n')
    await writeFile(join(root, 'ignored.tsx'), '<div className="p:96px"/>')
    await worker(first)
    const warm = await cssGraph(state.outputPath)
    expect(warm).not.toMatch(/padding:(?:19|96|97|98|99)px/)
    expect(warm).toContain('margin:23px')
    await dispose(root)
    await rm(dirname(state.outputPath), { recursive: true })
    await prepareNextStatic(options, setup)
    expect(await cssGraph(state.outputPath)).toBe(warm)
    await writeFile(join(root, 'renamed.mdx'), 'export const broken =')
    await expect(worker(first)).rejects.toThrow()
    expect(await cssGraph(state.outputPath)).toBe(warm)
    await rm(join(root, 'renamed.mdx'))
    await worker(first)
    expect(await cssGraph(state.outputPath)).not.toContain('margin:23px')
  } finally { await dispose(root); await rm(root, { recursive: true, force: true }) }
}, 60000)

test('a source edit during composition retries with a complete fresh snapshot', async () => {
  const root = await mkdtemp(join(tmpdir(), 'next-snapshot-race-'))
  const source = join(root, 'page.tsx')
  try {
    await writeFile(join(root, 'app.css'), '@master entry;')
    await writeFile(source, '<div className="p:11px"/>')
    const state = (await prepareNextStatic({}, { projectDir: root }))!
    const session = [...globalThis.__MASTER_CSS_NEXT_STATIC_SESSIONS__!.entries()].find(([key]) => key.startsWith(root + '\0'))![1]
    const compose = session.stylesheets.compose.bind(session.stylesheets)
    vi.spyOn(session.stylesheets, 'compose').mockImplementationOnce(async options => {
      const result = await compose(options)
      await writeFile(source, '<div className="p:29px"/>')
      return result
    })
    await scanStaticModule(state.statePath, source, '')
    const css = await cssGraph(state.outputPath)
    expect(css).toContain('padding:29px')
    expect(css).not.toContain('padding:11px')
  } finally { await dispose(root); await rm(root, { recursive: true, force: true }) }
})
