
const rule = require('../../lib/rules/class-order')
const RuleTester = require('eslint').RuleTester
const ruleTester = new RuleTester({
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        }
    }
})

ruleTester.run('vue class order', rule, {
    valid: [{ code: `<div class="bg:black fg:white f:24 m:8 p:8">Simple, basic</div>` }],
    invalid: [
        {
            code: `<template><div class="m:8 bg:black p:8 fg:white f:24">Enhancing readability</div></template>`,
            output: `<template><div class="bg:black fg:white f:24 m:8 p:8">Enhancing readability</div></template>`,
            errors: [{ messageId: 'invalidClassOrder' }],
            filename: 'test.vue',
            parser: require.resolve('vue-eslint-parser'),
        },
    ],
})