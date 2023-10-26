import rule from '../src/rules/class-collision'
import { RuleTester } from 'eslint'

new RuleTester({
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
    }
}).run('collision', rule, {
    valid: [
        {
            code: `<div class="m:10 m:30:hover m:40@dark">Simple, basic</div>`,
        }
    ],
    invalid: [
        {
            code: `<div class="m:10 m:20 m:30:hover m:40@dark">collision</div>`,
            output: `<div class="m:10 m:30:hover m:40@dark">collision</div>`,
            errors: [
                { messageId: 'collisionClass' },
                { messageId: 'collisionClass' }
            ]
        }
    ]
})
