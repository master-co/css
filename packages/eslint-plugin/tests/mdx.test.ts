import OrderRule from '../src/rules/sort-classes'
import CollisionRule from '../src/rules/no-conflicting-classes'
import InvalidRule from '../src/rules/no-invalid-classes'
import PreferCanonicalRule from '../src/rules/prefer-canonical-classes'
import RawValueRule from '../src/rules/no-unapproved-raw-values'
import { jsxTester } from './testers'

const mdxLanguageOptions = {
    parser: await import('eslint-mdx')
}

jsxTester.run('mdx sort classes', OrderRule, {
    valid: [{ code: `<div class="m:2x p:2x font:1.5rem bg:black fg:white">Simple, basic</div>` }],
    invalid: [
        {
            code: `
            # Test
            <div class="m:2x bg:black p:2x fg:white font:1.5rem">Simple</div>`,
            output: `
            # Test
            <div class="m:2x p:2x font:1.5rem bg:black fg:white">Simple</div>`,
            errors: [{ messageId: 'invalidClassOrder' }],
            filename: 'test.mdx',
            languageOptions: mdxLanguageOptions
        },
        {
            code: [
                '```html',
                '<button class="inline-flex align-items:center gap:2x px:md py:xs r:md fg:white bg:blue-60">',
                '    Save',
                '</button>',
                '```'
            ].join('\n'),
            output: [
                '```html',
                '<button class="inline-flex align-items:center gap:2x px:md py:xs r:md bg:blue-60 fg:white">',
                '    Save',
                '</button>',
                '```'
            ].join('\n'),
            errors: [{ messageId: 'invalidClassOrder' }],
            filename: 'test.mdx',
            languageOptions: mdxLanguageOptions
        },
    ],
})

jsxTester.run('mdx no conflicting classes', CollisionRule, {
    valid: [],
    invalid: [
        {
            code: `<div class="m:10px m:20px m:30px:hover m:40px@dark">Simple</div>`,
            output: `<div class="m:20px m:30px:hover m:40px@dark">Simple</div>`,
            errors: [
                { messageId: 'collisionClass' }
            ],
            filename: 'test.mdx',
            languageOptions: mdxLanguageOptions
        },
        {
            code: [
                '```html',
                '<div class="m:10px m:20px">Simple</div>',
                '```'
            ].join('\n'),
            output: [
                '```html',
                '<div class="m:20px">Simple</div>',
                '```'
            ].join('\n'),
            errors: [
                { messageId: 'collisionClass' }
            ],
            filename: 'test.mdx',
            languageOptions: mdxLanguageOptions
        },
    ],
})

jsxTester.run('mdx no invalid classes', InvalidRule, {
    valid: [],
    invalid: [
        {
            code: [
                '```html',
                '<div class="btn">Simple</div>',
                '```'
            ].join('\n'),
            options: [{ disallowUnknownClass: true }],
            errors: [{ messageId: 'disallowUnknownClass' }],
            filename: 'test.mdx',
            languageOptions: mdxLanguageOptions
        },
    ],
})

jsxTester.run('mdx prefer canonical classes', PreferCanonicalRule, {
    valid: [
        {
            code: [
                '```html',
                '<div class="font:16px">Simple</div>',
                '```'
            ].join('\n'),
            options: [{ preferThemeTokens: false }],
            filename: 'test.mdx',
            languageOptions: mdxLanguageOptions
        },
    ],
    invalid: [
        {
            code: [
                '```html',
                '<button class="inline-flex align-items:center gap:2x px:md py:xs r:md fg:white bg:blue-60">',
                '    Save',
                '</button>',
                '```'
            ].join('\n'),
            output: [
                '```html',
                '<button class="inline-flex items-center gap:xs px:md py:xs r:md fg:white bg:blue-60">',
                '    Save',
                '</button>',
                '```'
            ].join('\n'),
            errors: [
                { messageId: 'preferClass', data: { actual: 'align-items:center', recommended: 'items-center' } },
                { messageId: 'preferClass', data: { actual: 'gap:2x', recommended: 'gap:xs' } },
            ],
            filename: 'test.mdx',
            languageOptions: mdxLanguageOptions
        },
    ],
})

jsxTester.run('mdx no unapproved raw values', RawValueRule, {
    valid: [],
    invalid: [
        {
            code: [
                '```html',
                '<div class="font:15px w:17px">Simple</div>',
                '```'
            ].join('\n'),
            options: [{ allowProperties: ['width'] }],
            errors: [{ messageId: 'unapprovedRawValue' }],
            filename: 'test.mdx',
            languageOptions: mdxLanguageOptions
        },
    ],
})
