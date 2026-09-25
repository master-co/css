import { expect, test, vi } from 'vitest'
import { createStaticQueue } from '../src/static-queue'

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>(done => { resolve = done })
  return { promise, resolve }
}

test('coalesces notifications only until capture; later notifications wait for a fresh round', async () => {
  const firstCaptured = deferred(), continueFirst = deferred(), secondCaptured = deferred(), continueSecond = deferred()
  let count = 0
  const run = vi.fn(async (_input: string | undefined, captured: () => void) => {
    captured()
    if (++count === 1) { firstCaptured.resolve(); await continueFirst.promise }
    else { secondCaptured.resolve(); await continueSecond.promise }
  })
  const write = createStaticQueue(run)
  const first = write(), shared = write()
  expect(shared).toBe(first)
  await firstCaptured.promise
  const later = write(), laterShared = write()
  expect(later).not.toBe(first)
  expect(laterShared).toBe(later)
  let finished = false
  void later.then(() => { finished = true })
  continueFirst.resolve()
  await first
  await secondCaptured.promise
  expect(finished).toBe(false)
  continueSecond.resolve()
  await later
  expect(run).toHaveBeenCalledTimes(2)
})

test('explicit stylesheet inputs remain ordered and a failed operation does not poison the queue', async () => {
  const inputs: (string | undefined)[] = []
  const write = createStaticQueue<string>(async (input, captured) => {
    captured(); inputs.push(input)
    if (input === 'bad') throw new Error('failed')
  })
  const first = write(), bad = write('bad'), next = write(), style = write('style'), last = write()
  expect(next).not.toBe(first)
  expect(last).not.toBe(next)
  await expect(bad).rejects.toThrow('failed')
  await Promise.all([first, next, style, last])
  expect(inputs).toEqual([undefined, 'bad', undefined, 'style', undefined])
})
