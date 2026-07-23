import { expect, it } from 'vitest'
import { createEngine } from '../src'

it('@master/css exposes only the Rust-backed async engine facade', async () => {
  const engine = await createEngine({ manifest: { version: 1 } })
  expect(engine.backend).toBe('native')
  expect(engine.snapshot().text).toBe('')
  engine.dispose()
})
