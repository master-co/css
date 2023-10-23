'use strict'

const rule = require('../lib/rules/class-validation')
const RuleTester = require('eslint').RuleTester

new RuleTester({
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
    }
}).run('invalid', rule, {
    valid: [
        {
            code: `<div class="bg:black fg:white f:24 m:8 p:8">Simple, basic</div>`,
        }
    ],
    invalid: [
        {
            code: `<div class="bg:black m:mistake rrr">Simple, basic</div>`,
            errors: [
                { messageId: 'invalidClass' },
                { messageId: 'disallowTraditionalClass' }
            ],
            options: [
                {
                    disallowTraditionalClass: true
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
            code: `<div class="bg:black m:mistake rrr btn">Simple, basic</div>`,
            errors: [
                { messageId: 'invalidClass' },
                { messageId: 'disallowTraditionalClass' }
            ],
            options: [
                {
                    disallowTraditionalClass: true
                }
            ]
        },
    ],
})