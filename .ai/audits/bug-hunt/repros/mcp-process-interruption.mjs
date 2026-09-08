import assert from 'node:assert/strict'
import { fork } from 'node:child_process'
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

if (process.argv[2] === 'worker') {
  const { default: Context } = await import('../../../../packages/mcp/src/context.ts')
  let context
  process.on('message', async message => {
    try {
      let value
      if (message.command === 'init') { context = new Context({ root: message.root }); value = { pid: process.pid } }
      else if (message.command === 'preview') value = await context.createPreview(message.changes)
      else if (message.command === 'apply') value = await context.applyPreview(message.token)
      else if (message.command === 'close') { context.dispose(); value = true }
      process.send({ id: message.id, ok: true, value }, () => { if (message.command === 'close') process.disconnect() })
    } catch (error) { process.send({ id: message.id, ok: false, error: error.message }) }
  })
} else {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-bh-interrupt-')))
  const workers = [], rows = []
  const evidence = fileURLToPath(new URL('../evidence/0086-process-interruption.json', import.meta.url))
  const save = row => { rows.push(row); writeFileSync(evidence, JSON.stringify({ root, rows }, null, 2)) }
  function startWorker() {
    const child = fork(fileURLToPath(import.meta.url), ['worker'], { execArgv: ['--import', 'tsx'], stdio: ['ignore', 'inherit', 'inherit', 'ipc'] })
    const pending = new Map()
    let serial = 0
    const exit = new Promise(resolve => child.once('exit', (code, signal) => {
      for (const entry of pending.values()) { clearTimeout(entry.timer); entry.resolve({ terminated: true, code, signal }) }
      pending.clear(); resolve({ pid: child.pid, code, signal })
    }))
    child.on('message', message => {
      const entry = pending.get(message.id)
      if (entry) { clearTimeout(entry.timer); pending.delete(message.id); entry.resolve(message) }
    })
    const call = message => new Promise((resolve, reject) => {
      const id = ++serial
      const timer = setTimeout(() => { pending.delete(id); reject(new Error('worker request timeout')) }, 15000)
      pending.set(id, { timer, resolve }); child.send({ id, ...message })
    })
    const worker = { child, exit, call }
    workers.push(worker)
    return worker
  }
  const initialize = async () => {
    const worker = startWorker()
    assert((await worker.call({ command: 'init', root })).ok)
    return worker
  }
  const preview = async (worker, changes) => {
    const result = await worker.call({ command: 'preview', changes })
    assert(result.ok && result.value.confirmToken)
    return result.value
  }
  const kill = async worker => {
    assert.equal(worker.child.exitCode, null)
    assert.equal(worker.child.signalCode, null)
    assert(worker.child.kill('SIGKILL'))
    const exited = await worker.exit
    assert.equal(exited.signal, 'SIGKILL')
    return exited
  }
  try {
    const file = join(root, 'before-apply.txt')
    writeFileSync(file, 'before')
    const first = await initialize()
    const pending = await preview(first, [{ filePath: file, afterText: 'after' }])
    const firstExit = await kill(first)
    assert.equal(readFileSync(file, 'utf8'), 'before')
    const restarted = await initialize()
    const oldToken = await restarted.call({ command: 'apply', token: pending.confirmToken })
    assert(!oldToken.ok && /Unknown or already applied/.test(oldToken.error))
    const fresh = await preview(restarted, [{ filePath: file, afterText: 'after' }])
    assert((await restarted.call({ command: 'apply', token: fresh.confirmToken })).ok)
    assert.equal(readFileSync(file, 'utf8'), 'after')
    save({ scenario: 'terminate before apply', firstExit, restartedPid: restarted.child.pid, oldToken, filesUnchangedAtTermination: true, freshPreviewRecovery: true })
    await restarted.call({ command: 'close' }); await restarted.exit

    const files = Array.from({ length: 1024 }, (_, index) => join(root, `bulk-${String(index).padStart(4, '0')}.txt`))
    files.forEach((path, index) => writeFileSync(path, `before-${index}`))
    const changes = files.map((filePath, index) => ({ filePath, afterText: `after-${index}` }))
    const writing = await initialize()
    const toApply = await preview(writing, changes)
    const applying = writing.call({ command: 'apply', token: toApply.confirmToken })
    const deadline = Date.now() + 10000
    while (await readFile(files[0], 'utf8') !== changes[0].afterText) {
      assert(Date.now() < deadline, 'first write observed within bounded window')
      await new Promise(resolve => setTimeout(resolve, 1))
    }
    const interruptedExit = await kill(writing)
    const interruptedResponse = await applying
    const fileStates = files.map((file, index) => ({ index, text: readFileSync(file, 'utf8') }))
    const completed = fileStates.filter(r => r.text === `after-${r.index}`).length
    const unchanged = fileStates.filter(r => r.text === `before-${r.index}`).length
    const other = fileStates.filter(r => r.text !== `after-${r.index}` && r.text !== `before-${r.index}`)
    save({ scenario: 'terminate during sequential apply', interruptedExit, interruptedResponse, completed, unchanged, other, fileStates })
    assert(completed > 0 && unchanged > 0, 'termination landed during writes rather than after completion')
    const recoveryWorker = await initialize()
    const lostToken = await recoveryWorker.call({ command: 'apply', token: toApply.confirmToken })
    assert(!lostToken.ok && /Unknown or already applied/.test(lostToken.error))
    const recovery = await preview(recoveryWorker, changes)
    assert.equal(recovery.changes.length, files.length - completed)
    assert((await recoveryWorker.call({ command: 'apply', token: recovery.confirmToken })).ok)
    assert(files.every((file, index) => readFileSync(file, 'utf8') === `after-${index}`))
    save({ scenario: 'restart after interrupted apply', pid: recoveryWorker.child.pid, lostToken, recoveryChanges: recovery.changes.length, allFilesRecovered: true })
    await recoveryWorker.call({ command: 'close' }); await recoveryWorker.exit
    save({ complete: true, workers: await Promise.all(workers.map(worker => worker.exit)), classification: 'In-memory tokens and sequential-write interruption; no persisted-token/atomicity guarantee claimed.' })
    console.log(JSON.stringify({ controls: 'PASS', completedBeforeKill: completed, unchanged, other: other.length, recovered: files.length }))
  } catch (error) { save({ error: String(error), stack: error.stack }); throw error }
  finally {
    for (const worker of workers) if (worker.child.exitCode === null && worker.child.signalCode === null) { worker.child.kill('SIGTERM'); await worker.exit }
    rmSync(root, { recursive: true, force: true })
  }
}
