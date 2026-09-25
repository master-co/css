/** Only ordinary module notifications may share work. Explicit inputs stay ordered. */
export function createStaticQueue<T>(run: (input: T | undefined, captured: () => void) => Promise<void>) {
  let chain = Promise.resolve()
  let pending: { promise: Promise<void> } | undefined
  return (input?: T) => {
    if (input === undefined && pending) return pending.promise
    const batch = { promise: Promise.resolve() }
    if (input === undefined) pending = batch
    else pending = undefined
    batch.promise = chain.catch(() => undefined).then(async () => {
      const captured = () => { if (pending === batch) pending = undefined }
      try { await run(input, captured) }
      finally { captured() }
    })
    chain = batch.promise
    return batch.promise
  }
}
