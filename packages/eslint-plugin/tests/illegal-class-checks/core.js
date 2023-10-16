/**
 * @fileoverview Use a consistent orders for the Master CSS classnames, based on property then on variants
 * @author Miles
 */
'use strict'

// Modified from https://github.com/francoismassart/eslint-plugin-tailwindcss

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var rule = require('../../lib/rules/illegal-class-checks')
var RuleTester = require('eslint').RuleTester
var parserOptions = {
    ecmaVersion: 2019,
    sourceType: 'module',
    ecmaFeatures: {
        jsx: true,
    },
}

var ruleTester = new RuleTester({ parserOptions })
ruleTester.run('illegal', rule, {
    valid: [
        {
            code: `<div class="bg:black fg:white f:24 m:8 p:8">Simple, basic</div>`,
        }
    ],
    invalid: [
        {
            code: `<div class="bg:black m:mistake rrr">Simple, basic</div>`,
            errors: [
                { messageId: 'illegalClassname' },
                { messageId: 'illegalClassname' }
            ],
        }
    ],
})