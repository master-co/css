import { expect, it } from 'vitest'
import { createCSS, previewCSS, type PreviewCSSOptions } from '../src'

it('@master/css re-exports the plan-driven engine facade', () => {
    const plan = { version: 3 } as const
    const css = createCSS(plan)
    const options: PreviewCSSOptions = {
        variableNames: []
    }
    expect(css.plan).toBe(plan)
    expect(previewCSS(css, [], options)).toBe('')
})
