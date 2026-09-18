// Adapted from the repository MCP bakery gate; CLI cannot depend on the MCP package.
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises'
import { userInfo } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

// One gate covers all roots and path aliases (including hard links). This is a
// cooperative local lock for CLI processes of the same OS user, not a lock on
// external editors. Use the account's home directory rather than environment
// overrides so independently configured clients still coordinate.
const NAME = /^(\d+)-[a-f0-9-]+\.json$/

interface Ticket {
  choosing: boolean
  number: string
}

function missing(error: unknown) {
  return (error as NodeJS.ErrnoException)?.code === 'ENOENT'
}

async function remove(file: string) {
  try { await unlink(file) } catch (error) { if (!missing(error)) throw error }
}

function alive(pid: number) {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    // Permissions and unknown errors are not evidence that a writer died.
    return (error as NodeJS.ErrnoException).code !== 'ESRCH'
  }
}

async function tickets(directory: string) {
  const entries: { id: string, choosing: boolean, number: bigint }[] = []
  for (const id of await readdir(directory)) {
    const register = id.endsWith('.next') ? id.slice(0, -5) : id
    const match = NAME.exec(register)
    if (!match) continue
    const file = join(directory, register)
    if (!alive(Number(match[1]))) {
      // IDs are never reused. Removing a dead owner's register cannot delete a
      // replacement owner's lock, unlike unlinking a shared stale lockfile.
      await remove(file)
      await remove(file + '.next')
      continue
    }
    if (id !== register) continue
    let text: string
    try { text = await readFile(file, 'utf8') } catch (error) {
      if (missing(error)) continue
      throw error
    }
    const value: Ticket = JSON.parse(text)
    if (typeof value.choosing !== 'boolean' || typeof value.number !== 'string' || !/^\d+$/.test(value.number)) {
      throw new Error(`Invalid CLI publication lock register: ${file}`)
    }
    entries.push({ id, choosing: value.choosing, number: BigInt(value.number) })
  }
  return entries
}

/** Serialize ownership, publication and cleanup across cooperating local CLI processes. */
export async function withStylesheetPublicationLock<T>(work: () => T | Promise<T>, options: { directory?: string, timeout?: number } = {}) {
  const directory = options.directory ?? join(userInfo().homedir, '.cache', 'mastercss', 'cli-publication-lock-v1')
  const deadline = performance.now() + (options.timeout ?? 30_000)
  const id = `${process.pid}-${randomUUID()}.json`
  const file = join(directory, id)
  await mkdir(directory, { recursive: true, mode: 0o700 })
  const publish = async (value: Ticket) => {
    await writeFile(file + '.next', JSON.stringify(value), { mode: 0o600 })
    await rename(file + '.next', file)
  }
  try {
    // Lamport's bakery doorway: publish choosing BEFORE observing peers, then
    // publish a ticket above every observed number. Atomic rename keeps each
    // register readable. New arrivals cannot overtake a published ticket.
    // Algorithm: https://lamport.azurewebsites.net/pubs/bakery.pdf
    await publish({ choosing: true, number: '0' })
    const peers = await tickets(directory)
    const number = peers.reduce((max, peer) => peer.number > max ? peer.number : max, 0n) + 1n
    await publish({ choosing: false, number: String(number) })
    while (true) {
      if (performance.now() >= deadline) throw new Error('Timed out waiting for another stylesheet publication.')
      const waiting = (await tickets(directory)).some(peer => peer.id !== id
        && (peer.choosing || peer.number < number || (peer.number === number && peer.id < id)))
      if (!waiting) return await work()
      await delay(10)
    }
  } finally {
    // Keep the empty directory: removing/recreating it could split contenders
    // between directory generations. Only the unique operation files are removed.
    await remove(file)
    await remove(file + '.next')
  }
}
