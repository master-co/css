/**
 * @fileoverview Use a consistent orders for the Master CSS classnames, based on property then on variants
 * @author Miles
 */
'use strict'

// Modified from https://github.com/francoismassart/eslint-plugin-tailwindcss

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var rule = require('../lib/rules/class-order')
var RuleTester = require('eslint').RuleTester
var parserOptions = {
    ecmaVersion: 2019,
    sourceType: 'module',
    ecmaFeatures: {
        jsx: true,
    },
}

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

describe('class-order', function () {
    it('basic', function () {
        var ruleTester = new RuleTester({ parserOptions })
        const generateErrors = (count) => {
            const errors = []

            for (let i = 0; i < count; i++) {
                errors.push({
                    messageId: 'invalidOrder',
                })
            }

            return errors
        }

        const errors = generateErrors(1)

        ruleTester.run('class-order', rule, {
            valid: [
                {
                    code: `<div class="bg:black fg:white f:24 m:8 p:8">Simple, basic</div>`,
                },
                {
                    code: `<div test="bg:black fg:white f:24 m:8 p:8">Simple, using 'test' prop</div>`,
                    options: [
                        {
                            classRegex: '^test$',
                        },
                    ],
                },
            ],
            invalid: [
                {
                    code: `
                        export interface FakePropsInterface {
                            readonly name?: string;
                        }
                        function Fake({
                            name = 'yolo'
                        }: FakeProps) {
                            return (
                            <>
                                <h1 className={"m:8 bg:black p:8 fg:white f:24"}>Welcome {name}</h1>
                                <p>Bye {name}</p>
                            </>
                            );
                        }
                        export default Fake;
                    `,
                    output: `
                        export interface FakePropsInterface {
                            readonly name?: string;
                        }
                        function Fake({
                            name = 'yolo'
                        }: FakeProps) {
                            return (
                            <>
                                <h1 className={"bg:black fg:white f:24 m:8 p:8"}>Welcome {name}</h1>
                                <p>Bye {name}</p>
                            </>
                            );
                        }
                        export default Fake;
                    `,
                    parser: require.resolve('@typescript-eslint/parser'),
                    errors: errors,
                },
                {
                    code: `<div class="fg:white f:24 m:8 p:8 bg:black">Classnames will be ordered</div>`,
                    output: `<div class="bg:black fg:white f:24 m:8 p:8">Classnames will be ordered</div>`,
                    errors: errors,
                },
                {
                    code: `<template><div class="m:8 bg:black p:8 fg:white f:24">Enhancing readability</div></template>`,
                    output: `<template><div class="bg:black fg:white f:24 m:8 p:8">Enhancing readability</div></template>`,
                    errors: errors,
                    filename: 'test.vue',
                    parser: require.resolve('vue-eslint-parser'),
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
                    errors: errors,
                    parser: require.resolve('@angular-eslint/template-parser'),
                },
                {
                    code: `<div class="flex uppercase m:0 m:0>li text-decoration:none>li>a px:4>li align-items:baseline fg:gray-30>li>a gap-x:28 font:12 font:semibold pb:6>li pt:20 pt:10>li {bb:3|solid|black}>li:has(>.router-link-active) {fg:black}>li:has(>.router-link-active)>a fg:gray-10>li>a:hover box-shadow:none>li>a:focus">Group</div>`,
                    output: `<div class="flex uppercase align-items:baseline box-shadow:none>li>a:focus fg:gray-30>li>a fg:gray-10>li>a:hover gap-x:28 font:12 font:semibold {bb:3|solid|black}>li:has(>.router-link-active) {fg:black}>li:has(>.router-link-active)>a m:0 m:0>li pb:6>li pt:20 pt:10>li px:4>li text-decoration:none>li>a">Group</div>`,
                    errors: errors,
                },
            ],
        })
    })
})