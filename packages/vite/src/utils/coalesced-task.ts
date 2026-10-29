/** Keep one active operation and collapse pending events into its latest follow-up. */
export function createCoalescedTask(work: () => Promise<void>, onError: (error: unknown) => void) {
  let running: Promise<void> | undefined
  let dirty = false
  return function schedule(): Promise<void> {
    dirty = true
    if (!running) {
      running = Promise.resolve().then(async () => {
        try {
          while (dirty) {
            dirty = false
            try { await work() } catch (error) { onError(error) }
          }
        } finally { running = undefined }
      })
    }
    return running
  }
}
