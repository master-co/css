/**
 * @fileoverview Use a consistent orders for the Master CSS classnames, based on property then on variants
 * @author Miles
 */
'use strict'

// Modified from https://github.com/francoismassart/eslint-plugin-tailwindcss

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

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
ruleTester.run('class order', rule, {
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
        // jsx
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
            errors: [{ messageId: 'invalidOrder' }],
        },
        {
            code: `<div class="fg:white f:24 m:8 p:8 bg:black">Classnames will be ordered</div>`,
            output: `<div class="bg:black fg:white f:24 m:8 p:8">Classnames will be ordered</div>`,
            errors: [{ messageId: 'invalidOrder' }],
        },
        // html, angular
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
            errors: [{ messageId: 'invalidOrder' }],
            parser: require.resolve('@angular-eslint/template-parser'),
        }
    ],
})