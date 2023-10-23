'use strict'

const rule = require('../lib/rules/class-order')
const RuleTester = require('eslint').RuleTester
const ruleTester = new RuleTester({
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
    }
})

ruleTester.run('class order', rule, {
    valid: [
        {
            code: `<div class="bg:black fg:white f:24 m:8 p:8">Simple, basic</div>`,
        },
        {
            code: `<div class="card mt:20">Traditional class + syntax</div>`,
        },
        {
            code: `<div test="bg:black fg:white f:24 m:8 p:8">Simple, using 'test' prop</div>`,
            options: [
                {
                    classMatching: '^test$',
                },
            ],
        },
    ],
    invalid: [
        {
            code: `<div class="fg:white f:24 m:8 p:8 bg:black">Classnames will be ordered</div>`,
            output: `<div class="bg:black fg:white f:24 m:8 p:8">Classnames will be ordered</div>`,
            errors: [{ messageId: 'invalidClassOrder' }],
        },
        {
            code: `
                    <div class="
                        m:8
                        bg:black
                        p:8
                        fg:white
                        f:24
                    ">
                        :)
                    </div>`,
            output: `
                    <div class="
                        bg:black
                        fg:white
                        f:24
                        m:8
                        p:8
                    ">
                        :)
                    </div>`,
            errors: [{ messageId: 'invalidClassOrder' }],
            parser: require.resolve('@angular-eslint/template-parser'),
        },
        {
            code: `<div class="flex uppercase m:0 m:0>li text-decoration:none>li>a px:4>li align-items:baseline fg:gray-30>li>a gap-x:28 font:12 font:semibold pb:6>li pt:20 pt:10>li {bb:3|solid|black}>li:has(>.router-link-active) {fg:black}>li:has(>.router-link-active)>a fg:gray-10>li>a:hover box-shadow:none>li>a:focus">Group</div>`,
            output: `<div class="flex uppercase align-items:baseline box-shadow:none>li>a:focus fg:gray-30>li>a fg:gray-10>li>a:hover gap-x:28 font:12 font:semibold {bb:3|solid|black}>li:has(>.router-link-active) {fg:black}>li:has(>.router-link-active)>a m:0 m:0>li pb:6>li pt:20 pt:10>li px:4>li text-decoration:none>li>a">Group</div>`,
            errors: [{ messageId: 'invalidClassOrder' }],
        }
    ],
})