import rule from '../src/rules/class-collision'
import { jsxTester } from './testers'

jsxTester.run('collision', rule, {
    valid: [
        { code: `<div class="m:10 m:30:hover m:40@dark">Simple, basic</div>` },
        { code: `<div class="a c d hello:world font:error mt:0 mt:0@sm">Error class</div>` },
        { code: `<div class="block m:32 font:12 mb:48"></div>` }
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
                { messageId: 'collisionClass' },
            ]
        }
    ]
})
