import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test, vi } from 'vitest'
import { captureStaticSnapshot, bytesFingerprint } from '../src/static-snapshot'
import { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import { defaultBuildManifest } from '@master/css-internal/project'
import { prepareNextStatic, scanStaticModule } from '../src/static'

vi.mock('node:fs/promises', async importOriginal => {
  const original = await importOriginal<typeof import('node:fs/promises')>()
  return { ...original, readFile: vi.fn(original.readFile) }
})

test('one immutable read supplies both extraction and fingerprint; later snapshots reread bytes', async () => {
  const root = await mkdtemp(join(tmpdir(), 'next-snapshot-bytes-'))
  const source = join(root, 'page.tsx'), binary = join(root, 'binary.bin')
  const scanner = new MasterCSSScanner({ manifest: defaultBuildManifest }, root)
  try {
    await writeFile(source, '<div className="p:11px"/>')
    await writeFile(binary, Buffer.from([0xff, 0xfe]))
    await scanner.init()
    vi.mocked(readFile).mockClear()
    const first = await captureStaticSnapshot(root, scanner, [source, binary])
    expect(vi.mocked(readFile).mock.calls.filter(([file]) => file === source)).toHaveLength(1)
    expect(first.hashes.get(source)).toBe(bytesFingerprint(first.contents.get(source)!))
    await writeFile(source, '<div className="p:12px"/>')
    await writeFile(binary, Buffer.from([0xfe, 0xff]))
    const second = await captureStaticSnapshot(root, scanner, [source, binary])
    expect(second.fingerprint).not.toBe(first.fingerprint)
    expect(second.hashes.get(binary)).not.toBe(first.hashes.get(binary))
    expect(first.contents.get(source)!.toString()).toContain('p:11px')
  } finally { await scanner.dispose(); await rm(root, { recursive: true, force: true }) }
})

test('a stable edit keeps four verification snapshots but reads each TSX only once per snapshot', async () => {
  const root = await mkdtemp(join(tmpdir(), 'next-snapshot-read-count-'))
  try {
    await writeFile(join(root, 'app.css'), '@master entry;')
    const files = Array.from({ length: 100 }, (_, index) => join(root, `page-${index}.tsx`))
    await Promise.all(files.map((file, index) => writeFile(file, `<div className="p:${index}px"/>`)))
    const state = (await prepareNextStatic({}, { projectDir: root }))!
    await writeFile(files[0], '<div className="p:999px"/>')
    vi.mocked(readFile).mockClear()
    await scanStaticModule(state.statePath, files[0], '')
    expect(vi.mocked(readFile).mock.calls.filter(([file]) => String(file).endsWith('.tsx'))).toHaveLength(400)
    vi.mocked(readFile).mockClear()
    await scanStaticModule(state.statePath, files[0], '')
    expect(vi.mocked(readFile).mock.calls.filter(([file]) => String(file).endsWith('.tsx'))).toHaveLength(200)
  } finally {
    for (const [key, session] of globalThis.__MASTER_CSS_NEXT_STATIC_SESSIONS__ ?? []) if (key.startsWith(root + '\0')) {
      await session.scanner.dispose(); session.stylesheets.dispose()
      globalThis.__MASTER_CSS_NEXT_STATIC_SESSIONS__!.delete(key)
    }
    await rm(root, { recursive: true, force: true })
  }
})


test('does not walk the actual bundler output tree during complete input discovery', async () => {
  const root = await mkdtemp(join(tmpdir(), 'next-output-pruning-'))
  const output = join(root, 'custom-output')
  const scanner = new MasterCSSScanner({ manifest: defaultBuildManifest, outputDirectories: [output] }, root)
  try {
    await mkdir(join(output, 'nested'), { recursive: true })
    await writeFile(join(output, 'nested/generated.tsx'), '<div className="p:999px"/>')
    await writeFile(join(root, 'page.tsx'), '<div className="p:11px"/>')
    await scanner.init()
    const allowed = vi.spyOn(scanner, 'isModuleAllowed')
    const snapshot = await captureStaticSnapshot(root, scanner, [])
    expect(snapshot.sources).toEqual([join(root, 'page.tsx')])
    expect(allowed.mock.calls.some(([file]) => file.startsWith(output))).toBe(false)
  } finally { await scanner.dispose(); await rm(root, { recursive: true, force: true }) }
})
