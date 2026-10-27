import fs from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test, vi } from 'vitest'
import { publishStylesheet } from '../src/publication'

for (const stage of ['resource-link', 'entry-rename'] as const) {
  test(`BH-0004 preserves the previous graph after ${stage} fails`, () => {
    const cwd = fs.mkdtempSync(join(tmpdir(), 'master-css-publication-fault-'))
    const entry = join(cwd, 'output.css')
    const oldCSS = '@import "./old.css";'
    const oldAsset = '.old{background:url(./old.svg)}'
    const outputFiles = new Set<string>()
    try {
      publishStylesheet(entry, oldCSS, new Map([
        [join(cwd, 'old.css'), Buffer.from(oldAsset)],
        [join(cwd, 'old.svg'), Buffer.from('<svg/>')]
      ]), outputFiles)
      const bytes = new Map([
        [join(cwd, 'new.css'), Buffer.from('.new{background:url(./new.svg)}')],
        [join(cwd, 'new.svg'), Buffer.from('<svg id="new"/>')]
      ])
      const link = fs.linkSync
      if (stage === 'resource-link') vi.spyOn(fs, 'linkSync').mockImplementation((from, to) => {
        if (to === join(cwd, 'new.svg')) throw Object.assign(new Error('injected resource write failure'), { code: 'EIO' })
        link(from, to)
      })
      else vi.spyOn(fs, 'renameSync').mockImplementation(() => { throw Object.assign(new Error('injected entry rename failure'), { code: 'EIO' }) })
      expect(() => publishStylesheet(entry, '@import "./new.css";', bytes, outputFiles)).toThrow('injected')
      expect(fs.readFileSync(entry, 'utf8')).toBe(oldCSS)
      expect(fs.readFileSync(join(cwd, 'old.css'), 'utf8')).toBe(oldAsset)
      expect(fs.readFileSync(join(cwd, 'old.svg'), 'utf8')).toBe('<svg/>')
      expect(fs.readFileSync(join(cwd, 'new.css'))).toEqual(bytes.get(join(cwd, 'new.css')))
      expect(fs.readdirSync(cwd).some(file => file.endsWith('.tmp'))).toBe(false)
      expect([...outputFiles].some(file => file.endsWith('.tmp'))).toBe(false)
      vi.restoreAllMocks()
      publishStylesheet(entry, '@import "./new.css";', bytes, outputFiles)
      expect(fs.readFileSync(entry, 'utf8')).toBe('@import "./new.css";')
      for (const [file, expected] of bytes) expect(fs.readFileSync(file)).toEqual(expected)
    } finally { vi.restoreAllMocks(); fs.rmSync(cwd, { recursive: true, force: true }) }
  })
}

for (const existing of [true, false]) {
  test(`BH-0004 atomic entry replacement preserves ${existing ? 'existing' : 'dangling'} symlinks`, () => {
    const cwd = fs.mkdtempSync(join(tmpdir(), 'master-css-publication-symlink-'))
    try {
      const entry = join(cwd, 'output.css')
      const target = join(cwd, 'actual.css')
      if (existing) { fs.writeFileSync(target, 'old'); fs.chmodSync(target, 0o666) }
      fs.symlinkSync('actual.css', entry)
      publishStylesheet(entry, 'new', new Map(), new Set())
      expect(fs.lstatSync(entry).isSymbolicLink()).toBe(true)
      expect(fs.readFileSync(target, 'utf8')).toBe('new')
      if (existing) expect(fs.statSync(target).mode & 0o777).toBe(0o666)
      expect(fs.readdirSync(cwd).sort()).toEqual(['actual.css', 'output.css'])
    } finally { fs.rmSync(cwd, { recursive: true, force: true }) }
  })
}

test('BH-0004 rejects a sidecar symlink without changing its target or the entry', () => {
  const cwd = fs.mkdtempSync(join(tmpdir(), 'master-css-publication-sidecar-link-'))
  try {
    const entry = join(cwd, 'output.css')
    fs.writeFileSync(entry, 'old entry')
    fs.writeFileSync(join(cwd, 'user.css'), 'same bytes')
    fs.symlinkSync('user.css', join(cwd, 'asset.css'))
    expect(() => publishStylesheet(entry, 'new entry', new Map([[join(cwd, 'asset.css'), Buffer.from('same bytes')]]), new Set())).toThrow('Refusing to overwrite stylesheet asset')
    expect(fs.readFileSync(entry, 'utf8')).toBe('old entry')
    expect(fs.readFileSync(join(cwd, 'user.css'), 'utf8')).toBe('same bytes')
    expect(fs.lstatSync(join(cwd, 'asset.css')).isSymbolicLink()).toBe(true)
  } finally { fs.rmSync(cwd, { recursive: true, force: true }) }
})
