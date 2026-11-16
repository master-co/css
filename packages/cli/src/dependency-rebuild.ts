import { createHash } from 'node:crypto'
import { readFileSync, statSync, type BigIntStats } from 'node:fs'
import { resolve } from 'node:path'

const identity = (stat: BigIntStats) => [stat.dev, stat.ino, stat.mode, stat.size, stat.mtimeNs, stat.ctimeNs].join(':')

function fileRevision(file: string) {
  try {
    const stat = statSync(file, { bigint: true, throwIfNoEntry: false })
    if (!stat?.isFile()) return undefined
    const hash = createHash('sha256').update(readFileSync(file)).digest('hex')
    const after = statSync(file, { bigint: true, throwIfNoEntry: false })
    // Never suppress an event when a file disappears or changes while sampled.
    return after && identity(stat) === identity(after) ? `${identity(stat)}:${hash}` : undefined
  } catch (error) {
    if (['ENOENT', 'ENOTDIR'].includes((error as NodeJS.ErrnoException).code ?? '')) return undefined
    throw error
  }
}

/** Called inside the watch queue, so each comparison follows the previous rebuild. */
export function createDependencyRebuild(rebuild: () => Promise<void>, ready: () => boolean) {
  const completed = new Map<string, string>()
  const rebuildDependency = async (file: string) => {
    const absolute = resolve(file)
    const revision = fileRevision(absolute)
    if (ready() && revision !== undefined && completed.get(absolute) === revision) return
    // Capture before rebuilding: an edit during compilation must remain pending,
    // even when another notification for the same file is already queued.
    // A failed or unsampleable attempt must not retain an older checkpoint.
    completed.delete(absolute)
    await rebuild()
    if (revision !== undefined) completed.set(absolute, revision)
  }
  return Object.assign(rebuildDependency, {
    /**
     * Samples dependency versions before a full rebuild that reads them all, which
     * may start from a source edit or a retry rather than a dependency event.
     */
    sample(files: Iterable<string>) {
      const revisions = new Map<string, string>()
      for (const file of files) {
        const absolute = resolve(file)
        const revision = fileRevision(absolute)
        if (revision !== undefined) revisions.set(absolute, revision)
      }
      return revisions
    },
    /**
     * Records the sampled versions once that rebuild succeeds, so late or duplicate
     * notifications for unchanged dependencies do not rebuild again. Files edited
     * during the rebuild no longer match their sample and still rebuild.
     */
    complete(revisions: ReadonlyMap<string, string>) {
      for (const [file, revision] of revisions) completed.set(file, revision)
    }
  })
}
