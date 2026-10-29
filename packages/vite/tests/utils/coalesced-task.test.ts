import { expect, test, vi } from 'vitest'
import { createCoalescedTask } from '../../src/utils/coalesced-task'

test('coalesces a burst and processes the latest change arriving during an active operation', async () => {
  let release!: () => void
  let value = 0
  const seen: number[] = []
  const gate = new Promise<void>(resolve => { release = resolve })
  const schedule = createCoalescedTask(async () => {
    seen.push(value)
    if (seen.length === 1) await gate
  }, error => { throw error })
  const first = schedule()
  await new Promise(resolve => setImmediate(resolve))
  for (value = 1; value <= 30; value++) void schedule()
  value = 30
  expect(seen).toEqual([0])
  release()
  await first
  expect(seen).toEqual([0, 30])
})

test('reports a failure and remains usable for subsequent updates', async () => {
  const error = vi.fn()
  const work = vi.fn().mockRejectedValueOnce(Error('broken')).mockResolvedValue(undefined)
  const schedule = createCoalescedTask(work, error)
  await schedule()
  await schedule()
  expect(error).toHaveBeenCalledTimes(1)
  expect(work).toHaveBeenCalledTimes(2)
})
