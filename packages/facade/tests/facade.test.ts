import { expect, it } from 'vitest'
import { createEngine, MasterCSS } from '../src'

it('@master/css re-exports the manifest-driven engine facade', () => {
  const manifest = { version: 1 } as const
  const css = MasterCSS.create({ manifest })
  expect(css.manifest).toBe(manifest)
  expect(css.text).toBe('')
})

it('@master/css exposes the Rust-backed async engine factory', async () => {
  const engine = await createEngine({ manifest: { version: 1 } })
  expect(engine.backend).toBe('native')
  expect(engine.text).toBe('')
  engine.dispose()
})
