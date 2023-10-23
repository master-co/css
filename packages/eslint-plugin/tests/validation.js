'use strict'

const rule = require('../lib/rules/class-validation')
const RuleTester = require('eslint').RuleTester
const ruleTester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2019,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
    }
})

ruleTester.run('invalid', rule, {
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
        },
        {
            code: `<div class="bg:black m:mistake rrr btn">Simple, basic</div>`,
            errors: [
                { messageId: 'invalidClass' },
                { messageId: 'disallowTraditionalClass' }
            ],
            options: [
                {
                    disallowTraditionalClass: true,
                    testConfig: {
                        styles: { btn: 'block' }
                    }
                }
            ]
        },
    ],
})