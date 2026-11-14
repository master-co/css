import { statSync } from 'node:fs'

/** A file as last read; a missing file has no stamp. */
export type FileStamp = readonly [file: string, mtimeMs: number, size: number]

/** Writes within this window may share a timestamp with the read that preceded them. */
const SETTLE_MS = 2000

function stamp(file: string): FileStamp {
  const stats = statSync(file, { throwIfNoEntry: false })
  return stats ? [file, stats.mtimeMs, stats.size] : [file, -1, -1]
}

/**
 * Stamps the files a result was computed from, or returns `undefined` when one
 * changed so recently that a later write could keep its stamp: such a result is
 * not reused.
 */
export function settledFileStamps(files: Iterable<string>, now = Date.now()): readonly FileStamp[] | undefined {
  const stamps = [...new Set(files)].map(stamp)
  return stamps.some(([, mtimeMs]) => mtimeMs > now - SETTLE_MS) ? undefined : stamps
}

/** Whether every stamped file is unchanged. */
export function fileStampsCurrent(stamps: readonly FileStamp[]) {
  return stamps.every(([file, mtimeMs, size]) => {
    const [, currentMtimeMs, currentSize] = stamp(file)
    return currentMtimeMs === mtimeMs && currentSize === size
  })
}
