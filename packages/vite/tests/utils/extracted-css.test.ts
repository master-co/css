import { expect, test, vi } from 'vitest'
import getExtractedCSS, { getExtractedCSSResult } from '../../src/utils/extracted-css'
import { clearDevStylesheets, devStylesheetState, getDevStylesheetDelivery } from '../../src/utils/dev-stylesheet-delivery'

const result = (name: string) => ({ css: '.card{color:red}', diagnostics: [], emittedGlobals: { variables: { [name]: 1 }, keyframes: {}, keyframeSlots: [], suppressedKeyframes: [] } })
function fixture() {
  return {
    config: { command: 'serve', root: process.cwd(), base: '/' },
    scanner: { css: { manifest: {} }, slotCSSRule: '#master-css-slot{--slot:0}' },
    stylesheets: { compose: vi.fn(async () => result('current')) },
    onEmittedGlobalsChange: vi.fn()
  } as any
}

test('metadata reads reuse delivery identity and leave stylesheet publication to CSS output', async () => {
  const context = fixture()
  try {
    expect(getDevStylesheetDelivery(context)).toBe(getDevStylesheetDelivery(context))
    await getExtractedCSSResult(context)
    expect(context.emittedGlobals.variables).toEqual({ current: 1 })
    expect(devStylesheetState(context).stylesheets.size).toBe(0)
    expect(await getExtractedCSS(context)).toContain('.card')
    expect(devStylesheetState(context).stylesheets.size).toBeGreaterThan(0)
  } finally { clearDevStylesheets(context) }
})

test.each(['newer composition', 'replacement scanner'])('an old result cannot overwrite metadata after a %s', async kind => {
  const context = fixture()
  let release!: (value: ReturnType<typeof result>) => void
  context.stylesheets.compose.mockReturnValueOnce(new Promise(resolve => { release = resolve }))
  const pending = getExtractedCSSResult(context)
  try {
    if (kind === 'newer composition') {
      await getExtractedCSSResult(context)
      expect(context.emittedGlobals.variables).toEqual({ current: 1 })
    } else context.scanner = { ...context.scanner }
    release(result('stale'))
    await pending
    expect(context.emittedGlobals?.variables).toEqual(kind === 'newer composition' ? { current: 1 } : undefined)
    expect(context.onEmittedGlobalsChange).toHaveBeenCalledTimes(kind === 'newer composition' ? 1 : 0)
  } finally { release(result('stale')); clearDevStylesheets(context) }
})
