import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm, stat, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import { addStaticCSSDependencies, prepareNextStatic, scanStaticModule, transformStaticStyleSource } from '../src/static'
import { readStaticPublication, staticProducerFingerprint, staticPublicationPath } from '../src/static-cache'
import { readStylesheetText } from './helpers/stylesheet-output'
import * as snapshotModule from '../src/static-snapshot'

const roots: string[] = []
afterEach(async () => {
  vi.restoreAllMocks()
  for (const root of roots.splice(0)) {
    for (const [key, session] of globalThis.__MASTER_CSS_NEXT_STATIC_SESSIONS__ ?? []) if (key.startsWith(root + '\0')) {
      await session.scanner.dispose(); session.stylesheets.dispose()
      globalThis.__MASTER_CSS_NEXT_STATIC_SESSIONS__!.delete(key)
    }
    await rm(root, { recursive: true, force: true })
  }
})
async function fixture(css = '@master entry;') {
  const root = await mkdtemp(join(tmpdir(), 'master-next-cache-'))
  roots.push(root)
  const entry = join(root, 'app.css'), source = join(root, 'page.tsx')
  await writeFile(entry, css)
  await writeFile(source, '<div className="p:11px"/>')
  const state = (await prepareNextStatic({}, { projectDir: root }))!
  const session = [...globalThis.__MASTER_CSS_NEXT_STATIC_SESSIONS__!.entries()].find(([key]) => key.startsWith(root + '\0'))![1]
  return { root, entry, source, state, session }
}
async function text(output: string) { return readStylesheetText(output, await readFile(output, 'utf8')) }

test('verified unchanged inputs skip registration, reconciliation, composition and CSS writes', async () => {
  const { state, source, session } = await fixture()
  const register = vi.spyOn(session.stylesheets, 'register'), compose = vi.spyOn(session.stylesheets, 'compose')
  const reconcile = vi.spyOn(session.scanner, 'reconcileSources')
  const before = (await stat(state.outputPath)).mtimeMs
  await scanStaticModule(state.statePath, source, '')
  expect(register).not.toHaveBeenCalled()
  expect(reconcile).not.toHaveBeenCalled()
  expect(compose).not.toHaveBeenCalled()
  expect((await stat(state.outputPath)).mtimeMs).toBe(before)
  const dependencies: string[] = []
  await addStaticCSSDependencies(state.statePath, file => dependencies.push(file))
  expect(dependencies).toContain(source)
})

test('class edits reuse the stylesheet collection, while CSS and processed inputs invalidate it', async () => {
  const { root, entry, source, state, session } = await fixture()
  const register = vi.spyOn(session.stylesheets, 'register')
  await writeFile(source, '<div className="p:29px"/>')
  await scanStaticModule(state.statePath, source, '')
  expect(register).not.toHaveBeenCalled()
  expect(await text(state.outputPath)).toContain('padding:29px')
  await writeFile(join(root, 'child.css'), '.probe{color:red}')
  await writeFile(entry, '@master entry;@import "./child.css";')
  await scanStaticModule(state.statePath, source, '')
  expect(register).toHaveBeenCalled()
  expect(await text(state.outputPath)).toMatch(/color:\s*red/)
  register.mockClear()
  await writeFile(join(root, 'child.css'), '.probe{color:blue}')
  await scanStaticModule(state.statePath, source, '')
  expect(register).toHaveBeenCalled()
  expect(await text(state.outputPath)).toMatch(/color:\s*#00f/)
  register.mockClear()
  await transformStaticStyleSource(state.statePath, entry, '@master entry;.processed{color:green}')
  expect(register).toHaveBeenCalled()
  expect(await text(state.outputPath)).toMatch(/color:\s*green/)
})

test('new CSS entries invalidate publication reuse even with unchanged markup', async () => {
  const { root, source, state } = await fixture()
  await writeFile(join(root, 'extra.css'), '@master entry;.new-entry{color:red}')
  await scanStaticModule(state.statePath, source, '')
  expect(await text(state.outputPath)).toContain('.new-entry')
  await rm(join(root, 'extra.css'))
  await scanStaticModule(state.statePath, source, '')
  expect(await text(state.outputPath)).not.toContain('.new-entry')
})

for (const failure of ['missing-record', 'broken-json', 'wrong-version', 'wrong-fingerprint', 'missing-entry', 'missing-asset', 'corrupt-asset'] as const) {
  test(`rebuilds a disposable publication cache: ${failure}`, async () => {
    const { state, source, session } = await fixture('@master entry;.probe{color:red}')
    const expected = await text(state.outputPath)
    const path = staticPublicationPath(state.outputPath)
    const record = (await readStaticPublication(state.outputPath, staticProducerFingerprint()))!
    const asset = record.outputs.find(([file]) => file !== state.outputPath)![0]
    if (failure === 'missing-record') await rm(path)
    if (failure === 'broken-json') await writeFile(path, '{bad')
    if (failure === 'wrong-version' || failure === 'wrong-fingerprint') {
      const saved = JSON.parse(await readFile(path, 'utf8'))
      saved.record[failure === 'wrong-version' ? 'version' : 'fingerprint'] = 'wrong'
      await writeFile(path, JSON.stringify(saved))
    }
    if (failure === 'missing-entry') await rm(state.outputPath)
    if (failure === 'missing-asset') await rm(asset)
    if (failure === 'corrupt-asset') await writeFile(asset, 'broken output')
    const compose = vi.spyOn(session.stylesheets, 'compose')
    await scanStaticModule(state.statePath, source, '')
    expect(compose).toHaveBeenCalled()
    expect(await text(state.outputPath)).toBe(expected)
    expect(await readStaticPublication(state.outputPath, staticProducerFingerprint())).toBeDefined()
  })
}

test('a fresh process uses the publication without compiling and retains all dependency hooks', async () => {
  const { root, state, source, entry } = await fixture()
  const script = `
    import {MasterCSSStylesheetCollection} from '@master/css-compiler/stylesheet';
    import {scanStaticModule,addStaticCSSDependencies} from ${JSON.stringify(new URL('../src/static.ts', import.meta.url).href)};
    MasterCSSStylesheetCollection.prototype.register = async () => {throw new Error('Unexpected register')};
    MasterCSSStylesheetCollection.prototype.compose = async () => {throw new Error('Unexpected compose')};
    await scanStaticModule(${JSON.stringify(state.statePath)},${JSON.stringify(source)},'');
    const deps=[]; await addStaticCSSDependencies(${JSON.stringify(state.statePath)},file=>deps.push(file));
    if(!deps.includes(${JSON.stringify(source)}) || !deps.includes(${JSON.stringify(entry)})) throw new Error('Missing dependencies');
  `
  const worker = (script: string) => new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], { stdio: ['ignore', 'pipe', 'pipe'] })
    let errors = ''
    child.stderr.on('data', chunk => { errors += chunk })
    child.on('error', reject)
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(errors)))
  })
  // Both producers run under the same loader/toolchain, independent of Vitest resolution.
  await worker(`import {prepareNextStatic} from ${JSON.stringify(new URL('../src/static.ts', import.meta.url).href)}; await prepareNextStatic({}, {projectDir:${JSON.stringify(root)}});`)
  await worker(script)
})

test('an edit during cache verification retries instead of accepting the old publication', async () => {
  const { source, state } = await fixture()
  const original = snapshotModule.captureStaticSnapshot
  vi.spyOn(snapshotModule, 'captureStaticSnapshot').mockImplementationOnce(async (...args) => {
    const snapshot = await original(...args)
    await writeFile(source, '<div className="p:31px"/>')
    return snapshot
  })
  await scanStaticModule(state.statePath, source, '')
  expect(await text(state.outputPath)).toContain('padding:31px')
  expect(await text(state.outputPath)).not.toContain('padding:11px')
})


test('same-mtime ignore changes invalidate the scanner policy as well as publication reuse', async () => {
  const { root, state, source } = await fixture()
  const ignore = join(root, '.gitignore')
  await writeFile(join(root, 'ignored.tsx'), '<div className="m:37px"/>')
  await writeFile(ignore, 'ignored.tsx\n')
  await scanStaticModule(state.statePath, source, '')
  expect(await text(state.outputPath)).not.toContain('margin:37px')
  const previous = await stat(ignore)
  await writeFile(ignore, 'another.tsx\n')
  await utimes(ignore, previous.atime, previous.mtime)
  await scanStaticModule(state.statePath, source, '')
  expect(await text(state.outputPath)).toContain('margin:37px')
})

test('explicit source globs conservatively rebuild to discover new ignored inputs', async () => {
  const { root, state, source } = await fixture('@master entry;@source "./hidden/*.tsx";')
  const { mkdir } = await import('node:fs/promises')
  await mkdir(join(root, 'hidden'))
  await writeFile(join(root, '.gitignore'), 'hidden/\n')
  await scanStaticModule(state.statePath, source, '')
  await writeFile(join(root, 'hidden/new.tsx'), '<div className="p:71px"/>')
  await scanStaticModule(state.statePath, source, '')
  expect(await text(state.outputPath)).toContain('padding:71px')
})


test('concurrent module notifications perform one composition for the shared current source set', async () => {
  const { source, state, session } = await fixture()
  await scanStaticModule(state.statePath, source, '')
  await writeFile(source, '<div className="p:43px"/>')
  const compose = vi.spyOn(session.stylesheets, 'compose')
  await Promise.all(Array.from({ length: 20 }, () => scanStaticModule(state.statePath, source, '')))
  expect(compose).toHaveBeenCalledTimes(2)
  expect(await text(state.outputPath)).toContain('padding:43px')
})

test('replacement, shared references and last-reference deletion agree with a fresh build', async () => {
  const { root, source, state } = await fixture()
  const shared = join(root, 'shared.tsx')
  await writeFile(shared, '<div className="p:11px m:22px"/>')
  await scanStaticModule(state.statePath, shared, '')
  await writeFile(source, '')
  await scanStaticModule(state.statePath, source, '')
  expect(await text(state.outputPath)).toContain('padding:11px')
  await writeFile(shared, '<div className="m:22px"/>')
  await scanStaticModule(state.statePath, shared, '')
  expect(await text(state.outputPath)).not.toContain('padding:11px')
  const warm = await text(state.outputPath)
  for (const [key, session] of globalThis.__MASTER_CSS_NEXT_STATIC_SESSIONS__ ?? []) if (key.startsWith(root + '\0')) {
    await session.scanner.dispose(); session.stylesheets.dispose()
    globalThis.__MASTER_CSS_NEXT_STATIC_SESSIONS__!.delete(key)
  }
  await rm(join(root, '.master'), { recursive: true })
  await prepareNextStatic({}, { projectDir: root })
  expect(await text(state.outputPath)).toBe(warm)
  await rm(shared)
  await scanStaticModule(state.statePath, source, '')
  expect(await text(state.outputPath)).not.toContain('margin:22px')
})

test('independent workers compile one changed snapshot once and subsequent publishers reuse it', async () => {
  const { root, state, source } = await fixture()
  const moduleURL = JSON.stringify(new URL('../src/static.ts', import.meta.url).href)
  const worker = (script: string) => new Promise<string>((resolve, reject) => {
    const child = spawn(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', script], { stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = '', stderr = ''
    child.stdout.on('data', chunk => { stdout += chunk })
    child.stderr.on('data', chunk => { stderr += chunk })
    child.on('error', reject)
    child.on('exit', code => code === 0 ? resolve(stdout) : reject(new Error(stderr)))
  })
  await worker(`import {prepareNextStatic} from ${moduleURL}; await prepareNextStatic({}, {projectDir:${JSON.stringify(root)}});`)
  await writeFile(source, '<div className="p:47px"/>')
  const script = `
    import {MasterCSSStylesheetCollection} from '@master/css-compiler/stylesheet';
    import {scanStaticModule} from ${moduleURL};
    const compose=MasterCSSStylesheetCollection.prototype.compose; let count=0;
    MasterCSSStylesheetCollection.prototype.compose=async function(...args){count++;return compose.apply(this,args)};
    await scanStaticModule(${JSON.stringify(state.statePath)},${JSON.stringify(source)},'');
    console.log(JSON.stringify({count}));
  `
  const results = await Promise.all(Array.from({ length: 3 }, () => worker(script)))
  expect(results.reduce((sum, output) => sum + JSON.parse(output.trim().split('\n').at(-1)!).count, 0)).toBe(2)
  expect(await text(state.outputPath)).toContain('padding:47px')
}, 30000)

test('package CSS entry changes invalidate cached resolution even when old files remain unchanged', async () => {
  const { root, entry, source, state } = await fixture()
  const { mkdir } = await import('node:fs/promises')
  const packageRoot = join(root, 'node_modules/@master/css')
  await mkdir(packageRoot, { recursive: true })
  await writeFile(join(packageRoot, 'red.css'), '.package-probe{color:red}')
  await writeFile(join(packageRoot, 'blue.css'), '.package-probe{color:blue}')
  const packageJSON = join(packageRoot, 'package.json')
  await writeFile(packageJSON, JSON.stringify({ name: '@master/css', style: './red.css' }))
  await writeFile(entry, '@import "@master/css";')
  await scanStaticModule(state.statePath, source, '')
  expect(await text(state.outputPath)).toMatch(/color:\s*red/)
  await writeFile(packageJSON, JSON.stringify({ name: '@master/css', style: './blue.css' }))
  await scanStaticModule(state.statePath, source, '')
  expect(await text(state.outputPath)).toMatch(/color:\s*(?:blue|#00f)/)
})
