import { test } from 'vitest'
import { expectLayers } from '../../test'

test.concurrent('queries', () => {
    expectLayers(
        {
            utilities: '@media (max-width:42mm) and (min-width:38mm){@supports (backdrop-filter:blur(0px)){.hidden\\@watch\\@supports-backdrop{display:none}}}'
        },
        'hidden@watch@supports-backdrop',
        { variants: [
                { name: 'watch', raw: '@watch', atRules: ['@media (max-width:42mm) and (min-width:38mm)'] },
                { name: 'supports-backdrop', raw: '@supports-backdrop', atRules: ['@supports (backdrop-filter:blur(0px))'] }
            ] }
    )
})
