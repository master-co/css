import { test } from 'vitest'
import { expectLayers } from '../../test'

test.concurrent('queries', () => {
    expectLayers(
        {
            general: '@media (max-device-width:42mm) and (min-device-width:38mm){@supports (backdrop-filter:blur(0px)){.hidden\\@watch\\@support-backdrop{display:none}}}'
        },
        'hidden@watch@support-backdrop',
        {
            at: {
                watch: {
                    type: 'media',
                    value: '(max-device-width:42mm) and (min-device-width:38mm)'
                },
                'support-backdrop': {
                    type: 'supports',
                    value: '(backdrop-filter:blur(0px))'
                }
            }
        }
    )
})