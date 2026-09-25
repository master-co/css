import { expect, test } from 'vitest'
import { createToolingBinding } from '../src/tooling-binding'

const request = { source: '<div class="display:block" />', languageId: 'html' }

test.each(['native', 'wasm'] as const)('%s prepared documents reject stale IDs without consuming newer work', async (binding) => {
  const tooling = await createToolingBinding({ binding })
  using session = await tooling.createLanguageSession({ version: 1, languageVersion: 3 })
  const first = session.prepareDocument(request)
  const second = session.prepareDocument(request)
  expect(() => session.finishDocument(first.id, [true])).toThrow()
  const result = session.finishDocument(second.id, [true])
  expect(result.classPositions.map(position => position.token)).toEqual(['display:block'])
  expect(result.semanticTokens.length).toBeGreaterThan(0)
  expect(() => session.finishDocument(second.id, [true])).toThrow()
})

test.each(['native', 'wasm'] as const)('%s releases prepared input after invalid requests and support payloads', async (binding) => {
  const tooling = await createToolingBinding({ binding })
  using session = await tooling.createLanguageSession({ version: 1, languageVersion: 3 })
  const first = session.prepareDocument(request)
  expect(() => session.prepareDocument({ ...request, source: 42 } as unknown as typeof request)).toThrow()
  expect(() => session.finishDocument(first.id, [true])).toThrow()
  const second = session.prepareDocument(request)
  expect(() => session.finishDocument(second.id, [null] as unknown as boolean[])).toThrow()
  expect(() => session.finishDocument(second.id, [true])).toThrow()
  const third = session.prepareDocument(request)
  session.dispose()
  expect(() => session.finishDocument(third.id, [true])).toThrow()
})
