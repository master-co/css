import { test } from 'vitest'
import { expectLayers } from '../../test'

test.concurrent('queries', () => {
    expectLayers(
        {
            general: '@media (max-width:42mm) and (min-width:38mm){@supports (backdrop-filter:blur(0px)){.hidden\\@watch\\@supports-backdrop{display:none}}}'
        },
        'hidden@watch@supports-backdrop',
        {
            at: {
                watch: 'media(max-width:42mm)and(min-width:38mm)',
                supports: {
                    backdrop: 'supports(backdrop-filter:blur(0px))'
                }
            }
        }
    )
})