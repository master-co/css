import { bench, describe } from 'vitest'
import {
  collectDocsPageCSSSizeSnapshot,
  printSnapshotSummary,
  writeSnapshot
} from './shared'

const benchOptions = {
  iterations: 1,
  retainSamples: true,
  throws: true,
  time: 1,
  warmup: false,
  warmupIterations: 0,
  warmupTime: 0
}

let collectionPromise: Promise<number> | undefined

async function collectAndWriteSnapshotOnce() {
  if (!collectionPromise) {
    collectionPromise = (async () => {
      const startedAt = performance.now()
      const snapshot = await collectDocsPageCSSSizeSnapshot()
      const collectionDuration = performance.now() - startedAt
      const outputFile = await writeSnapshot(snapshot)

      printSnapshotSummary(snapshot)
      console.log(`Wrote docs page CSS size snapshot to ${outputFile}`)

      return collectionDuration
    })()
  }

  return collectionPromise
}

describe('docs page CSS size', () => {
  bench('collect docs page CSS size snapshot', async () => {
    await collectAndWriteSnapshotOnce()
  }, benchOptions)
})
