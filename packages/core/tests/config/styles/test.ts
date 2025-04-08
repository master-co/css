import { test } from 'vitest'
import config from '../../config'
import extend from '@techor/extend'
import { expectLayers } from '../../test'

test.concurrent('components', () => {
    expectLayers(
        {
            components: '.btn{font-size:0.875rem;height:2.5rem;text-align:center}.light .btn{background-color:rgb(0 0 0);color:rgb(255 255 255);font-weight:600}.dark .btn{background-color:rgb(255 255 255);color:rgb(255 255 255);font-weight:500}'
        },
        'btn',
        config
    )

    expectLayers(
        {
            components: '.blue-btn{font-size:0.875rem;height:2.5rem;text-align:center}.light .blue-btn{background-color:rgb(0 0 0);color:rgb(255 255 255);font-weight:600;font-size:1.25rem}.dark .blue-btn{background-color:rgb(255 255 255);color:rgb(255 255 255);font-weight:500}'
        },
        'blue-btn',
        config
    )

    expectLayers(
        {
            components: '.blue-btn{font-size:0.875rem!important;height:2.5rem!important;text-align:center!important}.light .blue-btn{background-color:rgb(0 0 0)!important;color:rgb(255 255 255)!important;font-weight:600!important;font-size:1.25rem!important}.dark .blue-btn{background-color:rgb(255 255 255)!important;color:rgb(255 255 255)!important;font-weight:500!important}'
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