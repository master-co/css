import { expect, test } from 'vitest'
import { StylesheetDiagnosticRecorder } from '../shared/stylesheet-diagnostic'
import { stylesheetDiagnosticMetricIds } from '../shared/stylesheet-diagnostic-metrics'

test('phase timing waits for the actual asynchronous operation and preserves its return value', async () => {
  let clock = 2
  const recorder = new StylesheetDiagnosticRecorder(() => clock)
  let complete!: (value: object) => void
  const value = { result: 'complete' }
  const pending = recorder.time('operation', () => new Promise<object>(resolve => { complete = resolve }))
  expect(recorder.observations).toEqual([])
  clock = 9
  complete(value)
  expect(await pending).toBe(value)
  expect(recorder.values).toEqual({ operation: 7 })
  expect(recorder.observations).toEqual([{ metricId: 'operation', startedAt: 2, endedAt: 9, status: 'ok' }])
})

test('failed phases preserve error identity and record failure rather than successful work', async () => {
  let clock = 0
  const recorder = new StylesheetDiagnosticRecorder(() => clock)
  const failure = new Error('operation failed')
  await expect(recorder.time('operation', async () => { clock = 4; throw failure })).rejects.toBe(failure)
  expect(recorder.observations[0].status).toBe('error')
  expect(recorder.values.operation).toBe(4)
})

test('declared observation coverage rejects missing, unknown and invalid metrics without filling zeros', () => {
  const recorder = new StylesheetDiagnosticRecorder()
  recorder.set('present', 1)
  expect(() => recorder.assertComplete(['present', 'missing'])).toThrow('Missing diagnostic observation: missing')
  expect(recorder.values).toEqual({ present: 1 })
  expect(() => recorder.assertComplete([])).toThrow('Invalid diagnostic observation: present')
  recorder.set('present', NaN)
  expect(() => recorder.assertComplete(['present'])).toThrow('Invalid diagnostic observation')
  recorder.set('present', -1)
  expect(() => recorder.assertComplete(['present'])).toThrow('Invalid diagnostic observation')
  expect(new Set(stylesheetDiagnosticMetricIds).size).toBe(stylesheetDiagnosticMetricIds.length)
})
