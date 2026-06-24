import rule from '../src/rules/sort-classes'
import { createTester, jsxTester } from './testers'

jsxTester.run('adapter source matching defaults', rule, {
    valid: [
        { code: `twMerge('fg:white block')` },
        { code: `classList.contains('fg:white block')` },
    ],
    invalid: [
        {
            code: `classList.add('fg:white block')`,
            output: `classList.add('block fg:white')`,
            errors: [{ messageId: 'invalidClassOrder' }]
        },
        {
            code: `classList.remove('fg:white block')`,
            output: `classList.remove('block fg:white')`,
            errors: [{ messageId: 'invalidClassOrder' }]
        },
        {
            code: `classList.toggle('fg:white block')`,
            output: `classList.toggle('block fg:white')`,
            errors: [{ messageId: 'invalidClassOrder' }]
        },
        {
            code: `classList.replace('fg:white block', 'p:2x m:2x')`,
            output: `classList.replace('block fg:white', 'm:2x p:2x')`,
            errors: [
                { messageId: 'invalidClassOrder' },
                { messageId: 'invalidClassOrder' },
            ]
        },
        {
            code: `classList['add']('fg:white block')`,
            output: `classList['add']('block fg:white')`,
            errors: [{ messageId: 'invalidClassOrder' }]
        },
    ]
})

createTester({
    settings: {
        '@master/css': {
            classAttributes: ['data-(?:class|tw)', 'className'],
            classFunctions: ['tw', 'tokens\\.cx'],
            classDeclarations: ['styles', 'classes(?:List)?']
        }
    }
}).run('adapter source matching custom settings', rule, {
    valid: [
        { code: `<div data-class-extra="fg:white block" />` },
        { code: `twMerge('fg:white block')` },
        { code: `const stylesExtra = 'fg:white block'` },
        { code: `const theme = { stylesExtra: 'fg:white block' }` },
    ],
    invalid: [
        {
            code: `<div data-class="fg:white block" data-tw="p:2x m:2x" />`,
            output: `<div data-class="block fg:white" data-tw="m:2x p:2x" />`,
            errors: [
                { messageId: 'invalidClassOrder' },
                { messageId: 'invalidClassOrder' },
            ]
        },
        {
            code: `tw('fg:white block')`,
            output: `tw('block fg:white')`,
            errors: [{ messageId: 'invalidClassOrder' }]
        },
        {
            code: `tokens.cx('fg:white block')`,
            output: `tokens.cx('block fg:white')`,
            errors: [{ messageId: 'invalidClassOrder' }]
        },
        {
            code: 'tokens.cx`fg:white block`',
            output: 'tokens.cx`block fg:white`',
            errors: [{ messageId: 'invalidClassOrder' }]
        },
        {
            code: `const styles = 'fg:white block'`,
            output: `const styles = 'block fg:white'`,
            errors: [{ messageId: 'invalidClassOrder' }]
        },
        {
            code: `const classesList = { primary: 'fg:white block' }`,
            output: `const classesList = { primary: 'block fg:white' }`,
            errors: [{ messageId: 'invalidClassOrder' }]
        },
        {
            code: `const theme = { styles: 'fg:white block' }`,
            output: `const theme = { styles: 'block fg:white' }`,
            errors: [{ messageId: 'invalidClassOrder' }]
        },
    ]
})
