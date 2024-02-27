import rule from '../src/rules/class-collision'
import { RuleTester } from '@typescript-eslint/rule-tester'

new RuleTester({
    parser: require.resolve('@typescript-eslint/parser'),
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        }
    }
}).run('collision', rule, {
    valid: [
        {
            code: `<div class="m:10 m:30:hover m:40@dark">Simple, basic</div>`,
        },
        {
            code: `<div class="a c d hello:world font:error mt:0 mt:0@sm">Error class</div>`,
        },
    ],
    invalid: [
        {
            code: `<div class="m:10 m:20 m:30:hover m:40@dark">collision</div>`,
            output: `<div class="m:10 m:30:hover m:40@dark">collision</div>`,
            errors: [
                { messageId: 'collisionClass' },
                { messageId: 'collisionClass' }
            ]
        },
        {
            code: `<div class="a c d hello:world font:error mt:0 mt:0@sm m:10 m:20 m:30:hover m:40@dark">Error class</div>`,
            output: `<div class="a c d hello:world font:error mt:0 mt:0@sm m:10 m:30:hover m:40@dark">Error class</div>`,
            errors: [
                { messageId: 'collisionClass' },
                { messageId: 'collisionClass' }
            ]
        },
        {
            code: `<div class=":target_{invisible} :target_{visible}"></div>`,
            output: `<div class=":target_{invisible}"></div>`,
            errors: [
                { messageId: 'collisionClass' },
                { messageId: 'collisionClass' }
            ]
        }
    ]
})
