import rule from '../src/rules/no-conflicting-classes'
import { jsxTester } from './testers'

jsxTester.run('collision', rule, {
    valid: [
        { code: `<div class="m:10px m:30px:hover m:40px@dark">Simple, basic</div>` },
        { code: `<div class="a c d hello:world font:error mt:0 mt:0@sm">Error class</div>` },
        { code: `<div class="block m:8x font:.75rem mb:12x"></div>` }
    ],
    invalid: [
        {
            code: `<div class="m:10px m:20px m:30px:hover m:40px@dark">collision</div>`,
            output: `<div class="m:10px m:30px:hover m:40px@dark">collision</div>`,
            errors: [
                { messageId: 'collisionClass' },
                { messageId: 'collisionClass' }
            ]
        },
        {
            code: `<div class="a c d hello:world font:error mt:0 mt:0@sm m:10px m:20px m:30px:hover m:40px@dark">Error class</div>`,
            output: `<div class="a c d hello:world font:error mt:0 mt:0@sm m:10px m:30px:hover m:40px@dark">Error class</div>`,
            errors: [
                { messageId: 'collisionClass' },
                { messageId: 'collisionClass' },
            ]
        }
    ]
})
