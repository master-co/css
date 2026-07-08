import { expect, it } from 'vitest'
import { MasterCSS } from '../src'

it('@master/css re-exports the manifest-driven engine facade', () => {
  const manifest = { version: 1 } as const
  const css = MasterCSS.create({ manifest })
  expect(css.manifest).toBe(manifest)
  expect(css.text).toBe('')
})
