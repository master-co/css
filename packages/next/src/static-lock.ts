import { randomUUID } from 'node:crypto'
import { access, mkdir, open, readFile, stat, unlink } from 'node:fs/promises'
import { dirname } from 'node:path'
import { setTimeout } from 'node:timers/promises'

async function exists(file: string) {
  try { await access(file); return true }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false; throw error }
}
async function abandoned(file: string) {
  try {
    const owner = JSON.parse(await readFile(file, 'utf8')) as { pid: number }
    if (!Number.isSafeInteger(owner.pid) || owner.pid <= 0) throw new Error('Invalid lock owner')
    try { process.kill(owner.pid, 0); return false }
    catch (error) { return (error as NodeJS.ErrnoException).code === 'ESRCH' }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false
    // A newly acquired lock may still be writing its owner information.
    return Date.now() - (await stat(file)).mtimeMs > 30_000
  }
}
async function release(file: string, token: string) {
  try {
    const owner = JSON.parse(await readFile(file, 'utf8')) as { token: string }
    if (owner.token === token) await unlink(file)
  } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
}

/** One publisher per project, including independent bundler processes. */
export async function withStaticPublicationLock<T>(file: string, operation: () => Promise<T>): Promise<T> {
  await mkdir(dirname(file), { recursive: true })
  const token = randomUUID(), recovery = `${file}.recovery`, started = Date.now()
  while (true) {
    if (Date.now() - started > 30_000) throw new Error('Timed out waiting for the Master CSS publication lock. The previous complete output was retained.')
    if (await exists(recovery)) { await setTimeout(20); continue }
    try {
      const handle = await open(file, 'wx')
      try { await handle.writeFile(JSON.stringify({ pid: process.pid, token })) }
      finally { await handle.close() }
      // A reaper can start between the initial check and open(). A newly
      // acquired publisher never enters its critical section during recovery.
      if (await exists(recovery)) { await release(file, token); continue }
      break
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
      if (await abandoned(file)) {
        let guard
        try { guard = await open(recovery, 'wx') }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error }
        if (guard) {
          try {
            // Re-read while recovery is exclusive. Another reaper may already
            // have removed the abandoned owner and a live publisher replaced it.
            if (await abandoned(file)) await unlink(file).catch(error => { if (error.code !== 'ENOENT') throw error })
          } finally { await guard.close(); await unlink(recovery) }
        }
      }
      await setTimeout(20)
    }
  }
  try { return await operation() }
  finally { await release(file, token) }
}
