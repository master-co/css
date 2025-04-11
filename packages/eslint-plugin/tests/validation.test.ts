import rule from '../src/rules/class-validation'
import { RuleTester } from '@typescript-eslint/rule-tester'
import { createTester, jsxTester } from './testers'

jsxTester.run('invalid', rule, {
    valid: [
        {
            code: `<div class="bg:black f:24 fg:white m:8 p:8">Simple, basic</div>`,
        },
        {
            code: `<div class={\`f:\${ fontSize }px\`}>TemplateLiteral</div>`,
        },
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
            ] as any
        },
        {
            code: `<div class="bg:black m:mistake rrr">Simple, basic</div>`,
            errors: [
                { messageId: 'invalidClass' },
            ]
        },
        {
            code: `<div class="a c d hello:world font:error mt:0 mt:0@sm">Error class</div>`,
            errors: [
                { messageId: 'disallowUnknownClass' },
                { messageId: 'disallowUnknownClass' },
                { messageId: 'disallowUnknownClass' },
                { messageId: 'disallowUnknownClass' },
                { messageId: 'invalidClass' }
            ],
            options: [
                {
                    disallowUnknownClass: true
                }
            ] as any
        },
        {
            code: `<div class="a c d hello:world font:error mt:0 mt:0@sm">Error class</div>`,
            errors: [
                { messageId: 'invalidClass' }
            ]
        },
    ]
})

createTester({
    settings: {
        '@master/css': {
            config: {
                components: { btn: 'block' }
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
            ] as any
        },
        {
            code: `<div class="btn a c d hello:world font:error mt:0 mt:0@sm">Error class</div>`,
            errors: [
                { messageId: 'disallowUnknownClass' },
                { messageId: 'disallowUnknownClass' },
                { messageId: 'disallowUnknownClass' },
                { messageId: 'disallowUnknownClass' },
                { messageId: 'invalidClass' }
            ],
            options: [
                {
                    disallowUnknownClass: true
                }
            ] as any
        },
    ],
})