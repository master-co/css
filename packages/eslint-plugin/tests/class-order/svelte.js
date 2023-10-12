'use strict'

var rule = require('../../lib/rules/class-order')
var RuleTester = require('eslint').RuleTester
var parserOptions = {
    ecmaVersion: 2019,
    sourceType: 'module',
    ecmaFeatures: {
        jsx: true,
    },
}

var ruleTester = new RuleTester({ parserOptions })
ruleTester.run('svelte class order', rule, {
    valid: [{ code: `<div class="bg:black fg:white f:24 m:8 p:8">Simple, basic</div>` }],
    invalid: [
        {
            code: `<div class="m:8 bg:black p:8 fg:white f:24 {flipped ? 'flipped' : ''}">Enhancing readability</div>`,
            output: `<div class="bg:black fg:white f:24 m:8 p:8 {flipped ? 'flipped' : ''}">Enhancing readability</div>`,
            errors: [{ messageId: 'invalidOrder' }],
            filename: 'test.svelte',
            parser: require.resolve('svelte-eslint-parser'),
        },
    ],
})