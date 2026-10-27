import fs from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test, vi } from 'vitest'
import { ASSET_RETENTION_MS, publishOwnedStylesheet, stylesheetStatePath } from '../src/asset-ownership'

function project() {
  const cwd = fs.mkdtempSync(join(tmpdir(), 'master-css-asset-cleanup-'))
  const entry = join(cwd, 'output.css')
  const file = (id: string) => join(cwd, `master-a-${id}.css`)
  const publish = (id: string, now: number, output = entry) => publishOwnedStylesheet(output, `@import "./master-a-${id}.css";`, new Map([[file(id), Buffer.from(`.${id}{color:red}`)]]), new Set(), now)
  const state = (output = entry) => JSON.parse(fs.readFileSync(stylesheetStatePath(output), 'utf8'))
  return { cwd, entry, file, publish, state }
}

test('BH-0004 cleanup expires only older owned generations and always retains the previous one', () => {
  const { cwd, file, publish, state } = project()
  try {
    publish('one', 0); publish('two', 10); publish('three', 20)
    publish('three', ASSET_RETENTION_MS + 9)
    expect(fs.existsSync(file('one'))).toBe(true)
    publish('three', ASSET_RETENTION_MS + 10)
    expect(fs.existsSync(file('one'))).toBe(false)
    expect(fs.existsSync(file('two'))).toBe(true)
    expect(fs.existsSync(file('three'))).toBe(true)
    publish('three', ASSET_RETENTION_MS * 30)
    expect(fs.existsSync(file('two'))).toBe(true)
    expect(state().retained).toHaveLength(1)
    expect(Object.keys(state().owned).sort()).toEqual(['master-a-three.css', 'master-a-two.css'])
  } finally { fs.rmSync(cwd, { recursive: true, force: true }) }
})

for (const mutation of ['bytes', 'replacement', 'touch', 'permissions', 'symlink'] as const) {
  test(`BH-0004 relinquishes ownership after user ${mutation} without deleting the file`, () => {
    const { cwd, file, publish, state } = project()
    try {
      publish('one', 0); publish('two', 10); publish('three', 20)
      const original = fs.readFileSync(file('one'))
      if (mutation === 'bytes') fs.writeFileSync(file('one'), 'user bytes')
      if (mutation === 'replacement') { fs.unlinkSync(file('one')); fs.writeFileSync(file('one'), original) }
      if (mutation === 'touch') fs.utimesSync(file('one'), 1, 1)
      if (mutation === 'permissions') fs.chmodSync(file('one'), 0o444)
      if (mutation === 'symlink') { fs.unlinkSync(file('one')); fs.writeFileSync(join(cwd, 'user.css'), original); fs.symlinkSync('user.css', file('one')) }
      publish('three', ASSET_RETENTION_MS + 30)
      expect(fs.readFileSync(file('one'))).toEqual(mutation === 'bytes' ? Buffer.from('user bytes') : original)
      expect(state().owned['master-a-one.css']).toBeUndefined()
      if (mutation === 'symlink') expect(fs.lstatSync(file('one')).isSymbolicLink()).toBe(true)
    } finally { fs.rmSync(cwd, { recursive: true, force: true }) }
  })
}

test('BH-0004 never claims preexisting matching bytes or unrelated matching-prefix files', () => {
  const { cwd, file, publish, state } = project()
  try {
    fs.writeFileSync(file('one'), '.one{color:red}')
    fs.writeFileSync(file('unrelated'), 'user file')
    publish('one', 0)
    expect(state().owned).toEqual({})
    publish('two', 10); publish('three', 20); publish('three', ASSET_RETENTION_MS + 30)
    expect(fs.readFileSync(file('one'), 'utf8')).toBe('.one{color:red}')
    expect(fs.readFileSync(file('unrelated'), 'utf8')).toBe('user file')
  } finally { fs.rmSync(cwd, { recursive: true, force: true }) }
})

test('BH-0004 another output pins borrowed assets without acquiring their ownership', () => {
  const { cwd, file, publish, state } = project()
  try {
    const other = join(cwd, 'other.css')
    publish('one', 0); publish('one', 5, other)
    expect(state(other).owned).toEqual({})
    publish('two', 10); publish('three', 20); publish('three', ASSET_RETENTION_MS + 30)
    expect(fs.existsSync(file('one'))).toBe(true)
    publish('four', ASSET_RETENTION_MS + 40, other)
    publish('five', ASSET_RETENTION_MS + 50, other)
    publish('five', ASSET_RETENTION_MS * 2 + 40, other)
    publish('three', ASSET_RETENTION_MS * 2 + 50)
    expect(fs.existsSync(file('one'))).toBe(false)
    for (const id of ['two', 'three', 'four', 'five']) expect(fs.existsSync(file(id))).toBe(true)
  } finally { fs.rmSync(cwd, { recursive: true, force: true }) }
})

for (const stage of ['entry', 'final-journal'] as const) {
  test(`BH-0004 recovers journal state after ${stage} write failure`, () => {
    const { cwd, entry, file, publish, state } = project()
    const rename = fs.renameSync
    try {
      publish('one', 0)
      let journals = 0
      vi.spyOn(fs, 'renameSync').mockImplementation((from, to) => {
        if (to === stylesheetStatePath(entry)) journals++
        if ((stage === 'entry' && to === entry) || (stage === 'final-journal' && journals === 2 && to === stylesheetStatePath(entry))) throw new Error('injected publication fault')
        rename(from, to)
      })
      expect(() => publish('two', 10)).toThrow('injected publication fault')
      expect(state().pending).toBeDefined()
      expect(fs.readFileSync(entry, 'utf8')).toContain(stage === 'entry' ? 'one' : 'two')
      expect(fs.existsSync(file('one'))).toBe(true)
      vi.restoreAllMocks()
      publish('two', 20)
      expect(state().pending).toBeUndefined()
      expect(state().current.assets).toEqual(['master-a-two.css'])
      expect(state().retained[0].assets).toEqual(['master-a-one.css'])
      expect(fs.readdirSync(cwd).some(file => file.endsWith('.tmp'))).toBe(false)
    } finally { vi.restoreAllMocks(); fs.rmSync(cwd, { recursive: true, force: true }) }
  })
}

test('BH-0004 cleanup failure leaves valid output and retries later', () => {
  const { cwd, entry, file, publish, state } = project()
  const unlink = fs.unlinkSync
  try {
    publish('one', 0); publish('two', 10); publish('three', 20)
    vi.spyOn(fs, 'unlinkSync').mockImplementation(target => {
      if (target === file('one')) throw Object.assign(new Error('injected cleanup permission failure'), { code: 'EACCES' })
      unlink(target)
    })
    expect(() => publish('three', ASSET_RETENTION_MS + 30)).not.toThrow()
    expect(fs.readFileSync(entry, 'utf8')).toContain('three')
    expect(fs.existsSync(file('one'))).toBe(true)
    vi.restoreAllMocks()
    publish('three', ASSET_RETENTION_MS + 40)
    expect(fs.existsSync(file('one'))).toBe(false)
    expect(state().owned['master-a-one.css']).toBeUndefined()
  } finally { vi.restoreAllMocks(); fs.rmSync(cwd, { recursive: true, force: true }) }
})

test('BH-0004 abandoned pending assets are cleaned after their retention period', () => {
  const { cwd, entry, file, publish, state } = project()
  const rename = fs.renameSync
  try {
    publish('one', 0)
    vi.spyOn(fs, 'renameSync').mockImplementation((from, to) => {
      if (to === entry) throw new Error('injected entry failure')
      rename(from, to)
    })
    expect(() => publish('two', 10)).toThrow('injected entry failure')
    expect(fs.existsSync(file('two'))).toBe(true)
    vi.restoreAllMocks()
    publish('one', ASSET_RETENTION_MS + 10)
    expect(fs.readFileSync(entry, 'utf8')).toContain('one')
    expect(fs.existsSync(file('two'))).toBe(false)
    expect(state().pending).toBeUndefined()
    expect(Object.keys(state().owned)).toEqual(['master-a-one.css'])
  } finally { vi.restoreAllMocks(); fs.rmSync(cwd, { recursive: true, force: true }) }
})

test('BH-0004 malformed ownership data cannot authorize deletion outside the output directory', () => {
  const { cwd, entry, file, publish, state } = project()
  try {
    publish('one', 0)
    const previous = fs.readFileSync(entry)
    const invalid = state(); invalid.owned['../user.css'] = invalid.owned['master-a-one.css']
    const bytes = JSON.stringify(invalid); fs.writeFileSync(stylesheetStatePath(entry), bytes)
    expect(() => publish('two', 10)).toThrow('Invalid stylesheet ownership file')
    expect(fs.readFileSync(entry)).toEqual(previous)
    expect(fs.existsSync(file('one'))).toBe(true)
    expect(fs.readFileSync(stylesheetStatePath(entry), 'utf8')).toBe(bytes)
  } finally { fs.rmSync(cwd, { recursive: true, force: true }) }
})
