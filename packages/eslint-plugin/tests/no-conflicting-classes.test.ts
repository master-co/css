import rule from '../src/rules/no-conflicting-classes'
import { jsxTester } from './testers'

jsxTester.run('collision', rule, {
    valid: [
        { code: `<div class="m:10px m:30px:hover m:40px@dark">Simple, basic</div>` },
        { code: `<div class="a c d hello:world font:error mt:0 mt:0@sm">Error class</div>` },
        { code: `<div class="mx:md ml:lg@sm"></div>` },
        { code: `<div class="mx:md m:lg"></div>` }
    ],
    invalid: [
        {
            code: `<div class="m:10px m:20px m:30px:hover m:40px@dark">collision</div>`,
            output: `<div class="m:20px m:30px:hover m:40px@dark">collision</div>`,
            errors: [
                { messageId: 'collisionClass' }
            ]
        },
        {
            code: `<div class="a c d hello:world font:error mt:0 mt:0@sm m:10px m:20px m:30px:hover m:40px@dark">Error class</div>`,
            output: `<div class="a c d hello:world font:error mt:0 mt:0@sm m:20px m:30px:hover m:40px@dark">Error class</div>`,
            errors: [
                { messageId: 'collisionClass' },
            ]
        },
        {
            code: `<div class="m:10px m:20px m:30px">last class wins</div>`,
            output: `<div class="m:30px">last class wins</div>`,
            errors: [
                { messageId: 'collisionClass' },
            ]
        },
        {
            code: `<div class="mx:md ml:lg">partial margin axis conflict</div>`,
            output: `<div class="mr:md ml:lg">partial margin axis conflict</div>`,
            errors: [
                { messageId: 'partialCollisionClass', data: { actual: 'mx:md', replacement: 'mr:md', conflict: 'ml:lg' } },
            ]
        },
        {
            code: `<div class="p:md px:lg">partial padding shorthand conflict</div>`,
            output: `<div class="py:md px:lg">partial padding shorthand conflict</div>`,
            errors: [
                { messageId: 'partialCollisionClass', data: { actual: 'p:md', replacement: 'py:md', conflict: 'px:lg' } },
            ]
        },
        {
            code: `<div class="m:md mt:lg">partial shorthand side conflict</div>`,
            output: `<div class="mx:md mb:md mt:lg">partial shorthand side conflict</div>`,
            errors: [
                { messageId: 'partialCollisionClass', data: { actual: 'm:md', replacement: 'mx:md mb:md', conflict: 'mt:lg' } },
            ]
        },
        {
            code: `<div class="block m:8x font:.75rem mb:12x"></div>`,
            output: `<div class="block mx:8x mt:8x font:.75rem mb:12x"></div>`,
            errors: [
                { messageId: 'partialCollisionClass', data: { actual: 'm:8x', replacement: 'mx:8x mt:8x', conflict: 'mb:12x' } },
            ]
        },
        {
            code: `<div class="p:sm p:md px:lg">full conflict before partial conflict</div>`,
            output: [
                `<div class="p:md px:lg">full conflict before partial conflict</div>`,
                `<div class="py:md px:lg">full conflict before partial conflict</div>`
            ],
            errors: [
                { messageId: 'collisionClass' },
            ]
        }
    ]
})
