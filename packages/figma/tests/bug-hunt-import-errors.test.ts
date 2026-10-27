import { afterEach, expect, test, vi } from 'vitest'
import postAndWaitForMessage from '../src/utils/post-and-wait-for-message'

afterEach(() => vi.unstubAllGlobals())

test('BH-0022 plugin returns validation failures in the RPC response', async () => {
  const postMessage = vi.fn()
  const createVariable = vi.fn()
  vi.stubGlobal('__uiFiles__', { 'import-variables': '' })
  vi.stubGlobal('figma', { command: 'import-variables', showUI: vi.fn(), ui: { postMessage }, variables: { createVariable } })
  await import('../src/plugin.min')
  await figma.ui.onmessage!({ type: 'setCollectionVariables', data: { variableData: { variables: [{ key: '', value: 1 }] } } }, { origin: 'https://figma.com' })
  expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({
    type: 'setCollectionVariables', error: 'Invalid variable definition'
  }), { origin: '*' })
  expect(createVariable).not.toHaveBeenCalled()
})

test('BH-0022 UI rejects the plugin error immediately and accepts a later successful retry', async () => {
  const window = new EventTarget()
  vi.stubGlobal('window', window)
  vi.stubGlobal('parent', { postMessage: vi.fn() })
  const payload = { newVarCollName: 'Test', variableData: { variables: { base: 1 } } }
  const pending = postAndWaitForMessage('setCollectionVariables', payload)
  window.dispatchEvent(new MessageEvent('message', { data: { pluginMessage: { type: 'setCollectionVariables', error: 'Variable type mismatch' } } }))
  await expect(pending).rejects.toThrow('Variable type mismatch')
  const retry = postAndWaitForMessage('setCollectionVariables', payload)
  window.dispatchEvent(new MessageEvent('message', { data: { pluginMessage: { type: 'setCollectionVariables', data: null } } }))
  await expect(retry).resolves.toBeNull()
})
