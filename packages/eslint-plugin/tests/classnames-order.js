/**
 * @fileoverview Use a consistent orders for the Master CSS classnames, based on property then on variants
 * @author Miles
 */
'use strict'

// Modified from https://github.com/francoismassart/eslint-plugin-tailwindcss

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var rule = require('../lib/rules/classnames-order')
var RuleTester = require('eslint').RuleTester

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

var parserOptions = {
    ecmaVersion: 2019,
    sourceType: 'module',
    ecmaFeatures: {
        jsx: true,
    },
}

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

ruleTester.run('classnames-order', rule, {
    valid: [
        {
            code: `<div class="m:8 p:8 bg:black fg:white f:24">Simple, basic</div>`,
        },
        {
            code: `<div test="m:8 p:8 bg:black fg:white f:24">Simple, using 'test' prop</div>`,
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
                        <h1 className={"m:8 p:8 bg:black fg:white f:24"}>Welcome {name}</h1>
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
            output: `<div class="m:8 p:8 bg:black fg:white f:24">Classnames will be ordered</div>`,
            errors: errors,
        },
        {
            code: `<template><div class="m:8 bg:black p:8 fg:white f:24">Enhancing readability</div></template>`,
            output: `<template><div class="m:8 p:8 bg:black fg:white f:24">Enhancing readability</div></template>`,
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
                    m:8
                    p:8
                    bg:black
                    fg:white
                    f:24
                ">
                    :)
                </div>`,
            errors: errors,
            parser: require.resolve('@angular-eslint/template-parser'),
        }
    ],
})
