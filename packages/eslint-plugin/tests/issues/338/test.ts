import rule from '../../../src/rules/class-recommended'
import { jsxTester } from '../../testers'

jsxTester.run('issue 338 class-recommended', rule, {
    valid: [
        // Already using shorthand — no warning
        { code: `<div class="m:8">a</div>` },
        { code: `<div class="my:8">a</div>` },
        // Different values — not collapsable
        { code: `<div class="mt:8 mb:16">a</div>` },
        // Different conditions — not collapsable (mt:8 vs mb:8@sm)
        { code: `<div class="mt:8 mb:8@sm">a</div>` },
        // Single longhand — leave alone
        { code: `<div class="mt:8 bg:white">a</div>` },
    ],
    invalid: [
        {
            code: `<div class="mt:8 mb:8">a</div>`,
            output: `<div class="my:8">a</div>`,
            errors: [{ messageId: 'recommend' }]
        },
        {
            code: `<div class="ml:8 mr:8">a</div>`,
            output: `<div class="mx:8">a</div>`,
            errors: [{ messageId: 'recommend' }]
        },
        {
            code: `<div class="mt:8 mr:8 mb:8 ml:8">a</div>`,
            output: `<div class="m:8">a</div>`,
            errors: [{ messageId: 'recommend' }]
        },
        {
            code: `<div class="pt:16 pb:16">a</div>`,
            output: `<div class="py:16">a</div>`,
            errors: [{ messageId: 'recommend' }]
        },
        {
            // Conditions match → collapse preserves the condition
            code: `<div class="mt:8@sm mb:8@sm">a</div>`,
            output: `<div class="my:8@sm">a</div>`,
            errors: [{ messageId: 'recommend' }]
        },
        {
            // Important suffix preserved
            code: `<div class="mt:8! mb:8!">a</div>`,
            output: `<div class="my:8!">a</div>`,
            errors: [{ messageId: 'recommend' }]
        },
        {
            // 4-side has higher priority than 2-side: only one recommendation per group
            code: `<div class="bg:white mt:8 mr:8 mb:8 ml:8">a</div>`,
            output: `<div class="bg:white m:8">a</div>`,
            errors: [{ messageId: 'recommend' }]
        },
        {
            // 3-side: no 4-side match, but mt+mb still collapse to my, leaving ml alone
            code: `<div class="mt:8 mb:8 ml:8">a</div>`,
            output: `<div class="my:8 ml:8">a</div>`,
            errors: [{ messageId: 'recommend' }]
        },
    ]
})
