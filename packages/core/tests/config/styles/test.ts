import { test } from 'vitest'
import config from '../../config'
import extend from '@techor/extend'
import { expectLayers } from '../../test'

test.concurrent('components', () => {
    expectLayers(
        {
            components: '.btn{font-size:0.875rem}.btn{height:2.5rem}.btn{text-align:center}.light .btn{background-color:rgb(0 0 0)}.dark .btn{background-color:rgb(255 255 255)}.dark .btn{color:rgb(255 255 255)}.light .btn{color:rgb(255 255 255)}.dark .btn{font-weight:500}.light .btn{font-weight:500}'
        },
        'btn',
        config
    )

    expectLayers(
        {
            components: '.blue-btn{font-size:0.875rem}.blue-btn{height:2.5rem}.blue-btn{text-align:center}.light .blue-btn{background-color:rgb(0 0 0)}.dark .blue-btn{background-color:rgb(255 255 255)}.light .blue-btn{font-size:1.25rem}.dark .blue-btn{color:rgb(255 255 255)}.light .blue-btn{color:rgb(255 255 255)}.dark .blue-btn{font-weight:500}.light .blue-btn{font-weight:500}'
        },
        'blue-btn',
        config
    )

    expectLayers(
        {
            components: '.blue-btn{font-size:0.875rem!important}.blue-btn{height:2.5rem!important}.blue-btn{text-align:center!important}.light .blue-btn{background-color:rgb(0 0 0)!important}.dark .blue-btn{background-color:rgb(255 255 255)!important}.light .blue-btn{font-size:1.25rem!important}.dark .blue-btn{color:rgb(255 255 255)!important}.light .blue-btn{color:rgb(255 255 255)!important}.dark .blue-btn{font-weight:500!important}.light .blue-btn{font-weight:500!important}'
        },
        'blue-btn',
        extend(config, { important: true })
    )

    expectLayers(
        {
            theme: '.light,:root{--custom:0 0 0}.dark{--custom:255 255 255}',
            components: '.highlight-numbers .highlight-line:before{content:counter(lineNumber);display:inline-block;counter-increment:lineNumber;padding-right:1rem;text-align:right;margin-left:-0.3125rem;color:rgb(var(--custom));width:1.875rem;font-size:80%}'
        },
        'highlight-numbers',
        {
            variables: {
                custom: {
                    '@light': '$(black)',
                    '@dark': '$(white)'
                }
            },
            components: {
                'highlight-numbers': '{content:counter(lineNumber);inline-block;counter-increment:lineNumber;pr:16;text:right;ml:-5;fg:custom;w:30;font:80%}_.highlight-line:before'
            }
        }
    )
})