import { expect, it } from 'vitest'
import { createEngine } from '../src'

it('@master/css exposes only the Rust-backed async engine facade', async () => {
  const engine = await createEngine({ manifest: { version: 1 } })
  expect(engine.binding).toBe('native')
  expect(engine.snapshot().text).toBe('')
  engine.dispose()
})

it('@master/css re-exports the manifest-driven engine facade', async () => {
  const engine = await createEngine({ manifest: { version: 1 } })
  expect(engine.binding).toBe('native')
  expect(engine.snapshot().text).toBe('')
  engine.dispose()
})
