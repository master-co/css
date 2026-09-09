import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import fs from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const root = fileURLToPath(new URL('../../../../', import.meta.url))
const require = createRequire(new URL('../../../../package.json', import.meta.url))
const built = Boolean(process.env.BH_CLI_BUILT)
const location = built ? 'dist' : 'src'
const extension = built ? 'js' : 'ts'
const { ASSET_RETENTION_MS, publishOwnedStylesheet } = await import(`${root}/packages/cli/${location}/asset-ownership.${extension}`)
const { withStylesheetPublicationLock } = await import(`${root}/packages/cli/${location}/publication-lock.${extension}`)

if (process.argv[2] === '--worker') {
  const { cwd, worker } = JSON.parse(process.argv[3])
  for (let iteration = 0; iteration < 20; iteration++) {
    await withStylesheetPublicationLock(async () => {
      const sentinel = join(cwd, 'critical-section')
      const fd = fs.openSync(sentinel, 'wx'); fs.closeSync(fd)
      try {
        const count = Number(fs.readFileSync(join(cwd, 'count'), 'utf8'))
        const asset = `master-a-${worker}-${iteration}.css`
        const entry = join(cwd, iteration % 2 ? 'a.css' : 'b.css')
        const assets = new Map([
          [join(cwd, asset), Buffer.from(`.worker${worker}{color:red}`)],
          [join(cwd, 'master-a-shared.css'), Buffer.from('.shared{display:block}')]
        ])
        publishOwnedStylesheet(entry, `@import "./${asset}";@import "./master-a-shared.css";`, assets, new Set(), count * ASSET_RETENTION_MS)
        for (const file of fs.readdirSync(cwd).filter(file => file.endsWith('.master-css.json'))) {
          const state = JSON.parse(fs.readFileSync(join(cwd, file), 'utf8'))
          assert.equal(state.pending, undefined)
          for (const generation of [state.current, ...state.retained]) {
            for (const dependency of generation.assets) assert(fs.existsSync(join(cwd, dependency)), `${file}: missing ${dependency}`)
          }
        }
        assert.equal(fs.readFileSync(join(cwd, 'master-a-user.css'), 'utf8'), 'unrelated user bytes')
        await new Promise(resolve => setTimeout(resolve, 3))
        fs.writeFileSync(join(cwd, 'count'), String(count + 1))
      } finally { fs.unlinkSync(sentinel) }
    }, { directory: join(cwd, 'locks') })
  }
} else {
  const cwd = fs.mkdtempSync(join(tmpdir(), 'master-css-ownership-stress-'))
  const children = []
  try {
    fs.writeFileSync(join(cwd, 'count'), '0')
    fs.writeFileSync(join(cwd, 'master-a-user.css'), 'unrelated user bytes')
    const results = await Promise.all(Array.from({ length: 6 }, async (_, worker) => {
      const child = spawn(process.execPath, [...(built ? [] : ['--import', require.resolve('tsx')]), fileURLToPath(import.meta.url), '--worker', JSON.stringify({ cwd, worker })], { env: process.env })
      children.push(child); child.stdout.resume()
      let stderr = ''; child.stderr.on('data', bytes => { stderr += bytes })
      const [code, signal] = await once(child, 'exit')
      assert.equal(code, 0, stderr); assert.equal(signal, null)
      return { worker, code }
    }))
    assert.equal(Number(fs.readFileSync(join(cwd, 'count'), 'utf8')), 120)
    assert.deepEqual(fs.readdirSync(join(cwd, 'locks')), [])
    assert(!fs.readdirSync(cwd).some(file => file.endsWith('.tmp')))
    const remainingAssets = fs.readdirSync(cwd).filter(file => file.startsWith('master-'))
    assert(remainingAssets.length < 20, 'Expired owned generations should be collected')
    console.log(JSON.stringify({ built, workers: results, criticalSections: 120, missingReferences: 0, overlappingWriters: 0, remainingAssets, locksEmpty: true, result: 'PASS' }))
  } finally {
    for (const child of children) if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit'); child.kill('SIGKILL'); await exited
    }
    fs.rmSync(cwd, { recursive: true, force: true })
  }
}
