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
        {
          messageId: 'collisionClass',
          data: {
            message: 'Remove class "m:10px"; it is overridden by later class "m:20px".'
          }
        }
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
        {
          messageId: 'partialCollisionClass',
          data: {
            message: 'Replace "mx:md" with "mr:md"; later class "ml:lg" overrides part of "mx:md".'
          }
        },
      ]
    },
    {
      code: `<div class="p:md px:lg">partial padding shorthand conflict</div>`,
      output: `<div class="py:md px:lg">partial padding shorthand conflict</div>`,
      errors: [
        { messageId: 'partialCollisionClass' },
      ]
    },
    {
      code: `<div class="m:md mt:lg">partial shorthand side conflict</div>`,
      output: `<div class="mx:md mb:md mt:lg">partial shorthand side conflict</div>`,
      errors: [
        { messageId: 'partialCollisionClass' },
      ]
    },
    {
      code: `<div class="block m:8x font:.75rem mb:12x"></div>`,
      output: `<div class="block mx:8x mt:8x font:.75rem mb:12x"></div>`,
      errors: [
        { messageId: 'partialCollisionClass' },
      ]
    },
    {
      code: `<div class="mx:md ml:lg py:md pt:lg">multiple partial conflicts</div>`,
      output: `<div class="mr:md ml:lg pb:md pt:lg">multiple partial conflicts</div>`,
      errors: [
        { messageId: 'partialCollisionClass' },
        { messageId: 'partialCollisionClass' },
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
    },
    {
      code: `<div class="inset:md top:lg">partial inset conflict</div>`,
      output: `<div class="right:md bottom:md left:md top:lg">partial inset conflict</div>`,
      errors: [
        { messageId: 'partialCollisionClass' },
      ]
    },
    {
      code: `<div class="r:md rtl:lg">partial radius conflict</div>`,
      output: `<div class="rtr:md rbr:md rbl:md rtl:lg">partial radius conflict</div>`,
      errors: [
        { messageId: 'partialCollisionClass' },
      ]
    },
    {
      code: `<div class="b:1px bt:2px">partial border width conflict</div>`,
      output: `<div class="br:1px bb:1px bl:1px bt:2px">partial border width conflict</div>`,
      errors: [
        { messageId: 'partialCollisionClass' },
      ]
    },
    {
      code: `<div class="b:red-60 bt:blue-60">partial border color conflict</div>`,
      output: `<div class="br:red-60 bb:red-60 bl:red-60 bt:blue-60">partial border color conflict</div>`,
      errors: [
        { messageId: 'partialCollisionClass' },
      ]
    },
    {
      code: `<div class="b-solid bt-dashed">partial border style conflict</div>`,
      output: `<div class="br-solid bb-solid bl-solid bt-dashed">partial border style conflict</div>`,
      errors: [
        { messageId: 'partialCollisionClass' },
      ]
    },
    {
      code: `<div class="mx:md ml:lg b:1px bt:2px">mixed partial conflicts</div>`,
      output: `<div class="mr:md ml:lg br:1px bb:1px bl:1px bt:2px">mixed partial conflicts</div>`,
      errors: [
        { messageId: 'partialCollisionClass' },
        { messageId: 'partialCollisionClass' },
      ]
    },
    {
      code: `<template><div class="b-solid bt-dashed">Vue</div></template>`,
      output: `<template><div class="br-solid bb-solid bl-solid bt-dashed">Vue</div></template>`,
      errors: [
        { messageId: 'partialCollisionClass' },
      ],
      filename: 'test.vue',
      languageOptions: {
        parser: await import('vue-eslint-parser')
      }
    }
  ]
})
