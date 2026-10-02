import { expect, it } from 'vitest'
import { createEngine } from '../src'

it('@master/css exposes only the Rust-backed async engine facade', async () => {
  const engine = await createEngine({ manifest: {
  "version": 5 as const,
  "languageVersion": 14 as const
} })
  expect(engine.binding).toBe('native')
  expect(engine.snapshot().text).toBe('')
  engine.dispose()
})

it('@master/css re-exports the manifest-driven engine facade', async () => {
  const engine = await createEngine({ manifest: {
  "version": 5 as const,
  "languageVersion": 14 as const
} })
  expect(engine.binding).toBe('native')
  expect(engine.snapshot().text).toBe('')
  engine.dispose()
})
