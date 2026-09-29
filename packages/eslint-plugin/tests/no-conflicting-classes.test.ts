import rule from '../src/rules/no-conflicting-classes'
import { jsxTester } from './testers'

jsxTester.run('collision', rule, {
  valid: [
{ code: "<div class=\"margin:10px margin:30px:hover margin:40px@dark\">Simple, basic</div>" },
{ code: "<div class=\"a c d hello:world font:error margin-top:0 margin-top:0@sm\">Error class</div>" },
{ code: `<div class="mx-md ml-lg@sm"></div>` },
{ code: `<div class="mx-md m-lg"></div>` },
{
code: `<div class="mx-md ml-lg">partial margin axis conflict</div>`
},
{
code: `<div class="p-md px-lg">partial padding shorthand conflict</div>`
},
{
code: `<div class="m-md mt-lg">partial shorthand side conflict</div>`
},
{
code: "<div class=\"display:block margin:2rem font-size:.75rem margin-bottom:3rem\"></div>"
},
{
code: `<div class="mx-md ml-lg py-md pt-lg">multiple partial conflicts</div>`
},
{
code: `<div class="inset-md top-lg">partial inset conflict</div>`
},
{
code: `<div class="r-md rtl-lg">partial radius conflict</div>`
},
{
code: `<div class="border-width:1px border-top-width:2px">partial border width conflict</div>`
},
{
code: `<div class="b-red-60 bt-blue-60">partial border color conflict</div>`
},
{
code: `<div class="border-style:solid border-top-style:dashed">partial border style conflict</div>`
},
{
code: `<div class="mx-md ml-lg border-width:1px border-top-width:2px">mixed partial conflicts</div>`
},
{
code: `<template><div class="border-style:solid border-top-style:dashed">Vue</div></template>`,
filename: 'test.vue',
languageOptions: {
        parser: await import('vue-eslint-parser')
      }
}
],
  invalid: [
{
      code: "<div class=\"margin:10px margin:20px margin:30px:hover margin:40px@dark\">collision</div>",
      output: "<div class=\"margin:20px margin:30px:hover margin:40px@dark\">collision</div>",
      errors: [
        {
          messageId: 'collisionClass',
          data: {
            message: "Remove class \"margin:10px\"; it is overridden by class \"margin:20px\" in generated CSS."
          }
        }
      ]
    },
{
      code: "<div class=\"a c d hello:world font:error margin-top:0 margin-top:0@sm margin:10px margin:20px margin:30px:hover margin:40px@dark\">Error class</div>",
      output: "<div class=\"a c d hello:world font:error margin-top:0 margin-top:0@sm margin:20px margin:30px:hover margin:40px@dark\">Error class</div>",
      errors: [
        { messageId: 'collisionClass' },
      ]
    },
{
      code: "<div class=\"margin:10px margin:20px margin:30px\">generated CSS winner</div>",
      output: "<div class=\"margin:30px\">generated CSS winner</div>",
      errors: [
        { messageId: 'collisionClass' },
      ]
    },
{
      code: `<div class="p-sm p-md px-lg">full conflict before partial conflict</div>`,
      output: `<div class="p-sm px-lg">full conflict before partial conflict</div>`,
      errors: [
        { messageId: 'collisionClass' },
      ]
    }
]
})
