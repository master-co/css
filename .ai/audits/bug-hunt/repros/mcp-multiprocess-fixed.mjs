import assert from 'node:assert/strict'
import { fork } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

if (process.argv[2] === 'worker') {
  const { default: Context } = await import('../../../../packages/mcp/src/context.ts')
  let context
  process.on('message', async message => {
    try {
      let value
      if (message.command === 'init') { context = new Context({ roots: [message.root] }); value = { pid: process.pid } }
      else if (message.command === 'preview') value = await context.createPreview(message.changes)
      else if (message.command === 'apply') {
        if (message.at) await new Promise(resolve => setTimeout(resolve, Math.max(0, message.at - Date.now())))
        value = await context.applyPreview(message.token)
      } else if (message.command === 'close') { context.dispose(); value = true }
      process.send({ id: message.id, ok: true, value }, () => { if (message.command === 'close') process.disconnect() })
    } catch (error) { process.send({ id: message.id, ok: false, error: error.message }) }
  })
} else {
  const root = mkdtempSync(join(tmpdir(), 'master-css-bh-multiprocess-'))
  const children = [], rows = []
  const createWorker = () => {
    const child = fork(fileURLToPath(import.meta.url), ['worker'], { execArgv: ['--import', 'tsx'], stdio: ['ignore', 'pipe', 'pipe', 'ipc'] })
    children.push(child)
    let serial = 0
    const pending = new Map()
    child.stdout.on('data', data => process.stdout.write(data))
    child.stderr.on('data', data => process.stderr.write(data))
    child.on('message', message => { const entry = pending.get(message.id); if (entry) { clearTimeout(entry.timer); pending.delete(message.id); entry.resolve(message) } })
    child.on('exit', (code, signal) => { for (const entry of pending.values()) { clearTimeout(entry.timer); entry.reject(new Error(`worker exited ${code}/${signal}`)) }; pending.clear() })
    return message => new Promise((resolve, reject) => {
      const id = ++serial
      const timer = setTimeout(() => { pending.delete(id); reject(new Error('worker request timed out')) }, 30000)
      pending.set(id, { resolve, reject, timer }); child.send({ id, ...message })
    })
  }
  try {
    const a = createWorker(), b = createWorker()
    const workers = await Promise.all([a({ command: 'init', root }), b({ command: 'init', root })])
    assert(workers.every(r => r.ok)); assert.notEqual(workers[0].value.pid, workers[1].value.pid)
    const file = join(root, 'shared.txt')
    writeFileSync(file, 'before')
    const preview = async (worker, filePath, afterText) => {
      const result = await worker({ command: 'preview', changes: [{ filePath, afterText }] })
      assert(result.ok); assert(result.value.confirmToken); return result.value.confirmToken
    }
    const first = await preview(a, file, 'sequential-one')
    const second = await preview(b, file, 'sequential-two')
    assert((await a({ command: 'apply', token: first })).ok)
    const stale = await b({ command: 'apply', token: second })
    assert(!stale.ok && /changed after preview/.test(stale.error))
    assert.equal(readFileSync(file, 'utf8'), 'sequential-one')
    rows.push({ control: 'cross-process sequential stale rejected', result: stale })
    const files = [join(root, 'a.txt'), join(root, 'b.txt')]
    files.forEach(f => writeFileSync(f, 'before'))
    const independent = await Promise.all([preview(a, files[0], 'one'), preview(b, files[1], 'two')])
    const result = await Promise.all([a({ command: 'apply', token: independent[0] }), b({ command: 'apply', token: independent[1] })])
    assert(result.every(r => r.ok)); assert.equal(readFileSync(files[0], 'utf8'), 'one'); assert.equal(readFileSync(files[1], 'utf8'), 'two')
    rows.push({ control: 'independent files apply concurrently', pass: true })
    for (let round = 0; round < 10; round++) {
      writeFileSync(file, 'before')
      const tokens = await Promise.all([preview(a, file, 'after-one'), preview(b, file, 'after-two')])
      const at = Date.now() + 100
      const outcomes = await Promise.all([a({ command: 'apply', token: tokens[0], at }), b({ command: 'apply', token: tokens[1], at })])
      rows.push({ round, outcomes, accepted: outcomes.filter(r => r.ok).length, finalText: readFileSync(file, 'utf8') })
    }
    const resultFile = fileURLToPath(new URL('../evidence/0101-multiprocess.json', import.meta.url))
    const evidence = { workers: workers.map(r => r.value.pid), rows, simultaneousBothAccepted: rows.filter(r => r.accepted === 2).length }
    writeFileSync(resultFile, JSON.stringify(evidence, null, 2))
    console.log(JSON.stringify(evidence))
    assert(rows.filter(r => 'round' in r).every(r => r.accepted === 1 && r.finalText === (r.outcomes[0].ok ? 'after-one' : 'after-two')), 'Only the accepted preview may determine final contents')
    await Promise.all([a({ command: 'close' }), b({ command: 'close' })])
    console.log(JSON.stringify({ controls: 'PASS', overlapRounds: 10, simultaneousBothAccepted: evidence.simultaneousBothAccepted }))
  } finally {
    for (const child of children) if (child.exitCode === null && child.signalCode === null) {
      if (child.connected) child.disconnect()
      await new Promise(resolve => {
        const timer = setTimeout(() => { child.kill('SIGTERM'); resolve() }, 1000)
        child.once('exit', () => { clearTimeout(timer); resolve() })
      })
    }
    rmSync(root, { recursive: true, force: true })
  }
}
