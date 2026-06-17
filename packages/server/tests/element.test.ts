import { it, test, expect } from 'vitest'
import { render } from '../src'
import defaultPlanJSON from '@master/css-preset/default-plan.json' with { type: 'json' }
import type { MasterCSSPlan } from 'shared/master-css-plan'

const defaultPlan = defaultPlanJSON as unknown as MasterCSSPlan

it('render elements', () => {
    expect(render([
        '<div class="text:center"></div>',
        '<div class="bg:white"></div>'
    ].join(''), defaultPlan).html).toEqual([
        '<style id="master">@layer utilities{.bg\\:white{background-color:oklch(100% 0 none)}.text\\:center{text-align:center}}</style>',
        '<div class="text:center"></div>',
        '<div class="bg:white"></div>'
    ].join(''))
})
