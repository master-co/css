import { test } from 'vitest'
import { expectLayers } from '../../test'

test.concurrent('queries', () => {
    expectLayers(
        {
            utilities: '@media (max-width:42mm) and (min-width:38mm){@supports (backdrop-filter:blur(0px)){.hidden\\@watch\\@supports-backdrop{display:none}}}'
        },
        'hidden@watch@supports-backdrop',
        { variants: [
                { token: '@watch', branches: [{ atRules: ['@media (max-width:42mm) and (min-width:38mm)'] }] },
                { token: '@supports-backdrop', branches: [{ atRules: ['@supports (backdrop-filter:blur(0px))'] }] }
            ] }
    )
})
