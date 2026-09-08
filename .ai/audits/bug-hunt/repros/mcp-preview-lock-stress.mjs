import assert from 'node:assert/strict'
import { fork } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { open, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { withPreviewWriteLock } from '../../../../packages/mcp/src/preview-write-lock.ts'

if (process.argv[2] === 'worker') {
  process.on('message', async ({ root, mode, rounds }) => {
    try {
      const options = { directory: join(root, 'locks') }
      if (mode === 'hold') {
        await withPreviewWriteLock(async () => {
          process.send({ holding: true, pid: process.pid })
          await new Promise(() => {})
        }, options)
      } else {
        for (let i = 0; i < rounds; i++) await withPreviewWriteLock(async () => {
          // Real exclusive-create sentinel detects overlapping critical sections.
          const sentinel = join(root, 'inside')
          const handle = await open(sentinel, 'wx')
          try {
            const counter = Number(readFileSync(join(root, 'counter'), 'utf8'))
            await new Promise(resolve => setTimeout(resolve, 2 + i % 3))
            writeFileSync(join(root, 'counter'), String(counter + 1))
          } finally { await handle.close(); await unlink(sentinel) }
        }, options)
        process.send({ done: true, pid: process.pid, rounds }, () => process.disconnect())
      }
    } catch (error) {
      process.send({ error: String(error) }, () => { process.exitCode = 1; process.disconnect() })
    }
  })
} else {
  const root = mkdtempSync(join(tmpdir(), 'mastercss-lock-stress-'))
  const workers = []
  const start = (mode, rounds) => {
    const child = fork(fileURLToPath(import.meta.url), ['worker'], { execArgv: ['--import', 'tsx'], stdio: ['ignore', 'inherit', 'inherit', 'ipc'] })
    const exit = new Promise(resolve => child.once('exit', (code, signal) => resolve({ pid: child.pid, code, signal })))
    const message = new Promise((resolve, reject) => {
      child.once('message', value => value.error ? reject(new Error(value.error)) : resolve(value))
      child.once('error', reject)
    })
    const worker = { child, exit, message }
    workers.push(worker)
    child.send({ root, mode, rounds })
    return worker
  }
  try {
    writeFileSync(join(root, 'counter'), '0')
    const contenders = Array.from({ length: 6 }, () => start('stress', 40))
    const reports = await Promise.all(contenders.map(worker => worker.message))
    const exits = await Promise.all(contenders.map(worker => worker.exit))
    assert(exits.every(exit => exit.code === 0))
    assert.equal(Number(readFileSync(join(root, 'counter'), 'utf8')), 240)
    assert.deepEqual(readdirSync(join(root, 'locks')), [])
    const held = start('hold')
    assert((await held.message).holding)
    const registered = readdirSync(join(root, 'locks'))
    assert.equal(registered.length, 1)
    assert(held.child.kill('SIGKILL'))
    const killed = await held.exit
    assert.equal(killed.signal, 'SIGKILL')
    // Two independent cleaners must safely reclaim the unique dead register.
    const recovering = [start('stress', 10), start('stress', 10)]
    await Promise.all(recovering.map(worker => worker.message))
    assert((await Promise.all(recovering.map(worker => worker.exit))).every(exit => exit.code === 0))
    assert.equal(Number(readFileSync(join(root, 'counter'), 'utf8')), 260)
    assert.deepEqual(readdirSync(join(root, 'locks')), [])
    console.log(JSON.stringify({ criticalSections: 260, overlappingSections: 0, reports, exits, killed, concurrentDeadOwnerRecovery: 'PASS', registersCleaned: true }))
  } finally {
    for (const worker of workers) if (worker.child.exitCode === null && worker.child.signalCode === null) {
      worker.child.kill('SIGTERM')
      await worker.exit
    }
    rmSync(root, { recursive: true, force: true })
  }
}
