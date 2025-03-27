import { test } from 'vitest'
import { expectLayers } from '../../test'

test.concurrent('queries', () => {
    expectLayers(
        {
            general: '@media (max-device-width:42mm) and (min-device-width:38mm){@supports (backdrop-filter:blur(0px)){.hidden\\@watch\\@supports-backdrop{display:none}}}'
        },
        'hidden@watch@supports-backdrop',
        {
            at: {
                watch: {
                    type: 'media',
                    value: '(max-device-width:42mm) and (min-device-width:38mm)'
                },
                'supports-backdrop': {
                    type: 'supports',
                    name: 'backdrop-filter',
                    value: 'blur(0px)'
                }
            }
        }
    )
})