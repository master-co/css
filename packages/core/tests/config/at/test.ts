import { test, expect } from 'vitest'
import { expectLayers } from '../../test'

test.concurrent('queries', () => {
    expectLayers(
        {
            general: '@supports (backdrop-filter:blur(0px)){@media (max-device-width:42mm) and (min-device-width:38mm){.hidden\\@watch\\@support-backdrop{display:none}}}'
        },
        'hidden@watch@support-backdrop',
        {
            at: {
                watch: 'media (max-device-width:42mm) and (min-device-width:38mm)',
                support: {
                    backdrop: 'supports (backdrop-filter:blur(0px))',
                }
            }
        }
    )
})