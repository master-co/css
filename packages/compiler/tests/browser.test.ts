import { expect, test } from 'vitest'
import { createCSS } from '@master/css-engine'
import defaultPlan from '@master/css-preset/default-plan'
import { compileCSSPlan } from '../src/browser'

test.concurrent('browser compileCSSPlan lowers directives with a base plan', async () => {
    const result = await compileCSSPlan(`
        @components {
            btn {
                @compose "flex";
                color: red;
            }
        }
    `, {
        basePlan: defaultPlan
    })
    const css = createCSS(result.plan)

    css.add('btn')

    expect(result.warnings).toEqual([])
    expect(result.plan.utilities?.some((utility) => utility.name === 'btn' && utility.layer === 'components')).toBe(true)
    expect(css.text).toContain('.btn')
    expect(css.text).toContain('display:flex')
    expect(css.text).toContain('color:red')
})

test.concurrent('browser compileCSSPlan rejects @reference directives', async () => {
    await expect(compileCSSPlan('@reference "./tokens.css";')).rejects.toThrow(
        'Browser compileCSSPlan cannot resolve @reference directives'
    )
})
