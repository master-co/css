import fs from 'node:fs'
import { platform, tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import { publishOwnedStylesheet, stylesheetStatePath } from '../../src/asset-ownership'

vi.mock('node:os', async original => ({ ...await original<typeof import('node:os')>(), platform: vi.fn(() => 'win32') }))
afterEach(() => { vi.restoreAllMocks(); vi.mocked(platform).mockReturnValue('win32') })

function project() {
  const cwd = fs.mkdtempSync(join(tmpdir(), 'master-css-488-rename-'))
  const entry = join(cwd, 'output.css'), target = join(cwd, 'actual.css'), journal = stylesheetStatePath(entry)
  const asset = (id: string) => join(cwd, `master-a-${id}.css`)
  const css = (id: string) => `@import "./master-a-${id}.css";`
  const publish = (id: string) => publishOwnedStylesheet(entry, css(id), new Map([[asset(id), Buffer.from(`.${id}{color:red}`)]]), new Set())
  fs.symlinkSync('actual.css', entry)
  publish('old')
  const mode = fs.statSync(target).mode & 0o777
  const state = () => JSON.parse(fs.readFileSync(journal, 'utf8'))
  return { cwd, entry, target, journal, asset, css, publish, mode, state }
}

for (const scenario of [
  { stage: 'entry', code: 'EPERM' },
  { stage: 'prepare-journal', code: 'EACCES' },
  { stage: 'commit-journal', code: 'EBUSY' }
] as const) {
  test(`488 retries a transient Windows ${scenario.code} at ${scenario.stage} inside one atomic publication`, () => {
    const f = project(), rename = fs.renameSync
    let journals = 0, injected = false, blocked = '', attempts = 0, entryPublications = 0
    try {
      vi.spyOn(fs, 'renameSync').mockImplementation((from, to) => {
        if (to === f.journal) journals++
        const selected = scenario.stage === 'entry' ? to === f.target
          : to === f.journal && journals === (scenario.stage === 'prepare-journal' ? 1 : 2)
        if (!injected && selected) {
          injected = true
          blocked = String(from)
          attempts++
          expect(fs.existsSync(blocked)).toBe(true)
          expect(fs.readFileSync(f.entry, 'utf8')).toBe(f.css(scenario.stage === 'commit-journal' ? 'next' : 'old'))
          if (scenario.stage !== 'prepare-journal') {
            expect(fs.readFileSync(f.asset('next'), 'utf8')).toBe('.next{color:red}')
            expect(f.state().pending).toBeDefined()
          } else expect(fs.existsSync(f.asset('next'))).toBe(false)
          throw Object.assign(new Error('controlled transient sharing violation'), { code: scenario.code })
        }
        if (String(from) === blocked) attempts++
        rename(from, to)
        if (to === f.target) entryPublications++
      })
      expect(f.publish('next')).toBe(true)
      expect(injected).toBe(true)
      expect(attempts).toBe(2)
      expect(entryPublications).toBe(1)
      expect(fs.readFileSync(f.entry, 'utf8')).toBe(f.css('next'))
      expect(fs.lstatSync(f.entry).isSymbolicLink()).toBe(true)
      expect(fs.statSync(f.target).mode & 0o777).toBe(f.mode)
      expect(f.state().pending).toBeUndefined()
      expect(f.state().current.assets).toEqual(['master-a-next.css'])
      expect(f.state().retained[0].assets).toEqual(['master-a-old.css'])
      expect(Object.keys(f.state().owned).sort()).toEqual(['master-a-next.css', 'master-a-old.css'])
      expect(fs.readdirSync(f.cwd).some(file => file.endsWith('.tmp'))).toBe(false)
    } finally { vi.restoreAllMocks(); fs.rmSync(f.cwd, { recursive: true, force: true }) }
  })
}

test('488 bounds a persistent Windows sharing denial without unlinking the last good output and can recover later', () => {
  const f = project(), rename = fs.renameSync
  const previous = fs.statSync(f.target, { bigint: true }).ino
  const error = Object.assign(new Error('persistent sharing violation'), { code: 'EPERM' })
  let attempts = 0, temporary = ''
  try {
    vi.spyOn(fs, 'renameSync').mockImplementation((from, to) => {
      if (to !== f.target) return rename(from, to)
      attempts++
      if (!temporary) temporary = String(from)
      expect(String(from)).toBe(temporary)
      expect(fs.existsSync(temporary)).toBe(true)
      expect(fs.statSync(f.target, { bigint: true }).ino).toBe(previous)
      expect(fs.readFileSync(f.target, 'utf8')).toBe(f.css('old'))
      throw error
    })
    expect(() => f.publish('next')).toThrow(error)
    expect(attempts).toBeGreaterThan(1)
    expect(attempts).toBeLessThanOrEqual(102)
    expect(fs.statSync(f.target, { bigint: true }).ino).toBe(previous)
    expect(fs.lstatSync(f.entry).isSymbolicLink()).toBe(true)
    expect(f.state().pending).toBeDefined()
    expect(fs.readFileSync(f.asset('old'), 'utf8')).toBe('.old{color:red}')
    expect(fs.readFileSync(f.asset('next'), 'utf8')).toBe('.next{color:red}')
    expect(fs.readdirSync(f.cwd).some(file => file.endsWith('.tmp'))).toBe(false)
    vi.restoreAllMocks()
    expect(f.publish('next')).toBe(true)
    expect(fs.readFileSync(f.entry, 'utf8')).toBe(f.css('next'))
    expect(f.state().pending).toBeUndefined()
  } finally { vi.restoreAllMocks(); fs.rmSync(f.cwd, { recursive: true, force: true }) }
})

for (const scenario of [
  { host: 'linux', code: 'EPERM' }, { host: 'linux', code: 'EACCES' },
  { host: 'linux', code: 'EBUSY' }, { host: 'win32', code: 'EIO' }
] as const) {
  test(`488 does not retry ${scenario.code} on ${scenario.host}`, () => {
    const f = project(), rename = fs.renameSync
    vi.mocked(platform).mockReturnValue(scenario.host)
    const error = Object.assign(new Error('non-transient or non-Windows failure'), { code: scenario.code })
    let attempts = 0
    try {
      vi.spyOn(fs, 'renameSync').mockImplementation((from, to) => {
        if (to !== f.target) return rename(from, to)
        attempts++
        throw error
      })
      expect(() => f.publish('next')).toThrow(error)
      expect(attempts).toBe(1)
      expect(fs.readFileSync(f.entry, 'utf8')).toBe(f.css('old'))
      expect(fs.lstatSync(f.entry).isSymbolicLink()).toBe(true)
    } finally { vi.restoreAllMocks(); fs.rmSync(f.cwd, { recursive: true, force: true }) }
  })
}
