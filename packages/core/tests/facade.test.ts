import { expect, it } from 'vitest'
import { createCSS } from '../src'

it('@master/css re-exports the plan-driven engine facade', () => {
    const plan = { version: 1 } as const
    const css = createCSS(plan)
    expect(css.plan).toBe(plan)
})
