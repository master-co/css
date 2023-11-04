import rule from '../src/rules/class-validation'
import { RuleTester } from 'eslint'

new RuleTester({
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
    }
}).run('invalid', rule, {
    valid: [
        {
            code: `<div class="bg:black f:24 fg:white m:8 p:8">Simple, basic</div>`,
        }
    ],
    invalid: [
        {
            code: `<div class="bg:black m:mistake rrr">Simple, basic</div>`,
            errors: [
                { messageId: 'invalidClass' },
                { messageId: 'disallowUnknownClass' }
            ],
            options: [
                {
                    disallowUnknownClass: true
                }
            ]
        },
        {
            code: `<div class="bg:black m:mistake rrr">Simple, basic</div>`,
            errors: [
                { messageId: 'invalidClass' },
            ]
        }
    ]
})

new RuleTester({
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
    },
    settings: {
        '@master/css': {
            config: {
                styles: { btn: 'block' }
            }
        }
    }
}).run('invalid', rule, {
    valid: [],
    invalid: [
        {
            code: `<div class="btn rrr bg:black m:mistake">Simple, basic</div>`,
            errors: [
                { messageId: 'disallowUnknownClass' },
                { messageId: 'invalidClass' }
            ],
            options: [
                {
                    disallowUnknownClass: true
                }
            ]
        },
    ],
})