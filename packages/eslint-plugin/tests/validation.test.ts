import rule from '../src/rules/class-validation'
import { RuleTester } from '@typescript-eslint/rule-tester'
import { createTester, jsxTester } from './testers'
import { createPresetPlan } from './helpers/create-preset-plan'
import UtilityType from 'shared/utility-type'

jsxTester.run('invalid', rule, {
    valid: [
        {
            code: `<div class="m:2x p:2x bg:black fg:white font:1.5rem">Simple, basic</div>`,
        },
        {
            code: `<div class={\`f:\${ fontSize }px\`}>TemplateLiteral</div>`,
        },
        {
            code: `<div class="{content:'';block}::after@light"></div>`,
        },
    ],
    invalid: [
        {
            code: `<div class="bg:black text-decoration:bad() rrr">Simple, basic</div>`,
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
            code: `<div class="bg:black text-decoration:bad() rrr">Simple, basic</div>`,
            errors: [
                { messageId: 'invalidClass' },
            ]
        },
        {
            code: `<div class="a c d hello:world text-decoration:bad() mt:0 mt:0@sm">Error class</div>`,
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
            code: `<div class="a c d hello:world text-decoration:bad() mt:0 mt:0@sm">Error class</div>`,
            errors: [
                { messageId: 'invalidClass' }
            ]
        },
    ]
})

createTester({
    settings: {
        '@master/css': {
            plan: createPresetPlan({
                utilities: [
                    {
                        name: 'btn',
                        type: UtilityType.Semantic,
                        layer: 'components',
                        rules: [
                            { selector: '&', declarations: { display: 'block' } }
                        ]
                    }
                ]
            })
        }
    }
}).run('invalid', rule, {
    valid: [],
    invalid: [
        {
            code: `<div class="btn rrr bg:black text-decoration:bad()">Simple, basic</div>`,
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
            code: `<div class="btn a c d hello:world text-decoration:bad() mt:0 mt:0@sm">Error class</div>`,
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
