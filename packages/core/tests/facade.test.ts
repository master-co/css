import { expect, it } from 'vitest'
import { createCSS, defaultPlan } from '../src'

it('@master/css re-exports the plan-driven engine facade', () => {
    const css = createCSS(defaultPlan)
    expect(css.plan).toBe(defaultPlan)
})
