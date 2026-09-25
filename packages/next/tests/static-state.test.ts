import { captureStaticStyleInput, loadStaticStyleInputs } from '../src/static-inputs'
import { expect, test } from 'vitest'
import { deserializeStaticOptions, serializeStaticOptions, staticFingerprint } from '../src/static-state'
import { withStaticPublicationLock } from '../src/static-lock'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

test('versioned RegExp transport preserves flags and changes the configuration fingerprint', () => {
  const original = { blocklist: [/^debug:/gi, 'hidden'] }
  const result = deserializeStaticOptions<typeof original>(serializeStaticOptions(original))
  expect(result.blocklist[0]).toEqual(/^debug:/gi)
  expect(staticFingerprint(result)).toBe(staticFingerprint(original))
  expect(staticFingerprint({ blocklist: [/^debug:/g] })).not.toBe(staticFingerprint(original))
  expect(() => deserializeStaticOptions('{"$masterCSSRegExp":1,"source":"x","flags":"z"}')).toThrow()
  expect(() => deserializeStaticOptions('{"$masterCSSRegExp":2,"source":"x","flags":""}')).toThrow()
})

test('publication lock serializes independent callers and releases after failure', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'master-next-lock-'))
  const file = join(directory, 'publish.lock')
  try {
    const events: string[] = []
    let release!: () => void
    const first = withStaticPublicationLock(file, async () => {
      events.push('first')
      await new Promise<void>(resolve => { release = resolve })
      events.push('released')
    })
    while (!release) await new Promise(resolve => setTimeout(resolve, 5))
    const second = withStaticPublicationLock(file, async () => { events.push('second') })
    release()
    await Promise.all([first, second])
    expect(events).toEqual(['first', 'released', 'second'])
    await expect(withStaticPublicationLock(file, async () => { throw new Error('failed') })).rejects.toThrow('failed')
    await expect(withStaticPublicationLock(file, async () => 'retry')).resolves.toBe('retry')
    await writeFile(file, JSON.stringify({ pid: 2147483647, token: 'dead' }))
    await expect(withStaticPublicationLock(file, async () => 'recovered')).resolves.toBe('recovered')
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test('independent processes serialize publication and safely race abandoned-lock recovery', async () => {
  const { spawn } = await import('node:child_process')
  const { readFile } = await import('node:fs/promises')
  const directory = await mkdtemp(join(tmpdir(), 'master-next-process-lock-'))
  const file = join(directory, 'publish.lock'), events = join(directory, 'events')
  const module = new URL('../src/static-lock.ts', import.meta.url).href
  try {
    await writeFile(file, JSON.stringify({ pid: 2147483647, token: 'dead' }))
    const run = (id: number) => new Promise<void>((resolve, reject) => {
      const script = `import {withStaticPublicationLock} from ${JSON.stringify(module)}; import {appendFile} from 'node:fs/promises'; await withStaticPublicationLock(${JSON.stringify(file)}, async()=>{await appendFile(${JSON.stringify(events)}, '${id}:start\\n'); await new Promise(resolve=>setTimeout(resolve,40)); await appendFile(${JSON.stringify(events)}, '${id}:end\\n')});`
      const child = spawn(process.execPath, ['--input-type=module', '-e', script], { stdio: ['ignore', 'pipe', 'pipe'] })
      let errors = ''
      child.stderr.on('data', chunk => { errors += chunk })
      child.on('error', reject)
      child.on('exit', code => code === 0 ? resolve() : reject(new Error(errors)))
    })
    await Promise.all(Array.from({ length: 6 }, (_, index) => run(index)))
    const lines = (await readFile(events, 'utf8')).trim().split('\n')
    expect(lines).toHaveLength(12)
    for (let index = 0; index < lines.length; index += 2) expect(lines[index + 1]).toBe(lines[index].replace(':start', ':end'))
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test('processed stylesheet inputs invalidate when their host dependencies change', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'master-next-input-deps-'))
  try {
    const file = join(directory, 'app.css'), dependency = join(directory, 'postcss.config.js'), output = join(directory, 'next.css')
    await writeFile(file, '@master entry;')
    await writeFile(dependency, 'first')
    const input = await captureStaticStyleInput(file, '@master entry;.processed{color:red}', [dependency])
    expect(Object.keys(await loadStaticStyleInputs(output, 'configuration', input))).toEqual([file])
    await writeFile(dependency, 'second')
    expect(await loadStaticStyleInputs(output, 'configuration')).toEqual({})
    await expect(loadStaticStyleInputs(output, 'configuration', input)).rejects.toThrow('changed during loader execution')
    const updated = await captureStaticStyleInput(file, '@master entry;.processed{color:blue}', [dependency])
    expect((await loadStaticStyleInputs(output, 'configuration', updated))[file].source).toContain('blue')
  } finally { await rm(directory, { recursive: true, force: true }) }
})
