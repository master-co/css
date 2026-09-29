import rule from '../src/rules/sort-classes'
import { createTester } from './testers'
import { createPresetManifest } from './helpers/create-preset-manifest'
import { UtilityType } from '@master/css-schema/utility-type'

createTester({
  settings: {
    '@master/css': {
      classAttributes: ['test', 'className', 'class'],
      manifest: createPresetManifest({
        mixins: [
  {
    "name": "--zDialog",
    "body": [
      {
        "type": "rule" as const,
        "selector": "&",
        "body": [
          {
            "type": "declaration" as const,
            "property": "z-index",
            "value": [
              {
                "type": "text" as const,
                "value": "10000"
              }
            ]
          }
        ]
      }
    ]
  }
],
      }),
    },
  },
}).run('sort classes', rule, {
  valid: [
    { code: "<div class=\"margin:0.5rem padding:0.5rem font-size:1.5rem bg-black fg-white\">Simple, basic</div>" },
    { code: "<div class=\"margin-top:1.25rem card\">Traditional class + syntax</div>" },
    {
      code: "<div className={ctl(`${live && 'bg-blue-10 bg-purple-40@dark border-radius:0.313rem@sm'} padding:0.625rem width:100%`)}>ctl + exp</div>",
    },
    {
      code: "<div className={ctl(`${className} border-radius:100% bg-blue-50 height:3rem width:3rem`)}>ctl + var</div>",
    },
    {
      code: "<div className={ctl(`${live && 'background: black@dark white'} padding:0.625rem width:100%`)}>Space trim issue</div>",
    },
    { code: "<div class='margin:0.5rem padding:0.5rem font-size:1.5rem bg-black fg-white'>Simple quotes</div>" },
    { code: "<div class=\"padding:0.5rem \">Extra space at the end</div>" },
    { code: "<div class=\"padding-inline:0.375rem padding:0.313rem padding-inline:0.188rem@sm padding-block:0.125rem@md padding:0.25rem@lg\">Native logical properties and condition order</div>" },
    {
      code: "ctl(`\n        display:flex\n        container-type:inline-size\n        width:0.75rem\n        width:0.375rem@sm\n        width:0.25rem@lg\n      `)",
    },
    { code: "<div class=\"width:0.75rem width:500px@lg\">Allowed arbitrary value</div>" },
    {
      code: "<div class=\"bg-black:focus:hover@dark bg-gray-40:disabled:focus:hover@md@dark\">Stackable variants</div>",
    },
    { code: "<div className={clsx(`position:absolute bottom:0 display:flex flex-direction:column height:270px width:100%`)}>clsx</div>" },
    { code: "<div class=\"zDialog display:flex width:0.75rem\">Number values</div>" },
    { code: "<div class=\"   display:flex  margin:0.625rem   \">Extra spaces</div>" },
    {
      code: "\n        <div className={`${yolo ? 'display:flex flex-direction:column' : 'display:block'} position:relative overflow:hidden width:100%`}>Issue #131</div>\n      ",
    },
    { code: "<div class>No errors while typing</div>" },
    { code: "<div class=\"display:block display:flex　margin-block:1px\">Do not treat full width space as class separator</div>" },
    { code: "<div class=\"margin:0.625rem margin:1.25rem margin:1.875rem:hover margin:2.5rem@dark\">Collision class</div>" },
    {
      code: "\n        export default () => (\n          <Demo $py={0}>\n            <div className=\"transition:transform|.2s transform:scale(1.1):hover\">\n              <Image\n                src={mobileImage}\n                className=\"pointer-events:none\"\n                width=\"480\"\n                height=\"319\"\n                priority={true}\n                alt=\"hello world\"\n              />\n              <h1 className=\"position:absolute inset:0 height:fit-content margin:auto font-weight-heavy font-size:7vw text-align:center fg-white animation:flash|3s|infinite blend:overlay font-size:2.5rem@xs\">\n                Hello, World!\n              </h1>\n            </div>\n          </Demo>\n        )\n      ",
    },
    { code: "<div class=\"margin-top:0 font:error hello:world margin-top:0@sm a c d\">Error class</div>" },
  ],
  invalid: [
    {
      code: "<div class=\"font-size:1.5rem fg-white margin:0.5rem padding:0.5rem bg-black\">Classnames will be ordered</div>",
      output: "<div class=\"margin:0.5rem padding:0.5rem font-size:1.5rem bg-black fg-white\">Classnames will be ordered</div>",
      errors: [{
        messageId: 'invalidClassOrder',
        data: {
          message: "Sort classes into the expected order: \"margin:0.5rem padding:0.5rem font-size:1.5rem bg-black fg-white\"."
        }
      }],
    },
    {
      code: "<div class=\"display:flex text-transform:uppercase margin:0 margin:0>li text-decoration:none>li>a padding-inline:0.25rem>li align-items:baseline fg-gray-30>li>a column-gap:1.75rem font-size:.75rem font-weight-medium padding-bottom:0.375rem>li padding-top:1.25rem padding-top:0.625rem>li border-bottom:3px|solid|oklch(0%|0|none)>li:has(>.router-link-active) fg-black>li:has(>.router-link-active)>a fg-gray-10>li>a:hover box-shadow:none>li>a:focus\">Selectors</div>",
      output: "<div class=\"display:flex align-items:baseline margin:0 padding-top:1.25rem font-weight-medium font-size:.75rem text-transform:uppercase column-gap:1.75rem margin:0>li padding-bottom:0.375rem>li padding-inline:0.25rem>li padding-top:0.625rem>li border-bottom:3px|solid|oklch(0%|0|none)>li:has(>.router-link-active) text-decoration:none>li>a fg-black>li:has(>.router-link-active)>a fg-gray-30>li>a fg-gray-10>li>a:hover box-shadow:none>li>a:focus\">Selectors</div>",
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: "<div test=\"padding:0.25rem padding-inline:0.438rem@sm padding:0.5rem@lg padding-block:0.313rem@sm\">Enhancing readability with 'test' prop</div>",
      output: "<div test=\"padding:0.25rem padding-block:0.313rem@sm padding-inline:0.438rem@sm padding:0.5rem@lg\">Enhancing readability with 'test' prop</div>",
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: "<div class=\"display:grid grid-cols(1) grid-cols(2)@sm padding-inline:0.5rem@sm padding-block:0.75rem@sm gap:0.5rem padding-block:1rem@md\">:)...</div>",
      output: "<div class=\"grid-cols(1) display:grid gap:0.5rem grid-cols(2)@sm padding-block:0.75rem@sm padding-inline:0.5rem@sm padding-block:1rem@md\">:)...</div>",
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: "<div className={ctl(`${live && 'bg-black@dark bg-white'} display:flex padding:0.625rem`)}>Space trim issue with fix</div>",
      output: "<div className={ctl(`${live && 'bg-white bg-black@dark'} display:flex padding:0.625rem`)}>Space trim issue with fix</div>",
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: "<div class='bg-black@dark bg-white'>Simple quotes</div>",
      output: "<div class='bg-white bg-black@dark'>Simple quotes</div>",
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: "clsx('color:#aaaaaa {content:\\'\\';display:block;height:100%;width:100%;position:absolute}::after background-color:#ffffff')",
      output: "clsx('background-color:#ffffff color:#aaaaaa {content:\\'\\';display:block;height:100%;width:100%;position:absolute}::after')",
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: "<div class=\"width:0.75rem width:0.375rem@lg width:0.75rem\">removeDuplicates</div>",
      output: "<div class=\"width:0.75rem width:0.375rem@lg\">removeDuplicates</div>",
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: "<div class=\"width:0.75rem  width:0.375rem@lg  width:0.75rem\">Single line dups + no head/tail spaces</div>",
      output: "<div class=\"width:0.75rem  width:0.375rem@lg\">Single line dups + no head/tail spaces</div>",
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: "<div class=\" width:0.75rem  width:0.375rem@lg   width:0.75rem\">Single dups line + head spaces</div>",
      output: "<div class=\" width:0.75rem  width:0.375rem@lg\">Single dups line + head spaces</div>",
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: "<div class=\"width:0.75rem  width:0.375rem@lg   width:0.75rem \">Single line dups + tail spaces</div>",
      output: "<div class=\"width:0.75rem  width:0.375rem@lg \">Single line dups + tail spaces</div>",
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: "\n        ctl(`\n          display:none\n          width:0.375rem@sm\n          display:block\n          display:none\n          display:flex\n          display:block\n          width:0.75rem\n          display:flex\n          display:block\n          width:0.25rem@lg\n          width:0.25rem@lg\n        `);\n      ",
      output: "\n        ctl(`\n          display:block\n          display:flex\n          display:none\n          width:0.75rem\n          width:0.375rem@sm\n          width:0.25rem@lg\n        `);\n      ",
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: "\n        ctl(`\n          invalid\n          width:0.375rem@sm\n          display:flex\n          container-type:inline-size\n          width:0.75rem\n          width:0.25rem@lg\n        `);\n      ",
      output: "\n        ctl(`\n          display:flex\n          container-type:inline-size\n          width:0.75rem\n          width:0.375rem@sm\n          width:0.25rem@lg\n          invalid\n        `);\n      ",
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: "<div class=\"width:0.75rem@sm width:320px\">Allowed arbitrary value but incorrect order</div>",
      output: "<div class=\"width:320px width:0.75rem@sm\">Allowed arbitrary value but incorrect order</div>",
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: "clsx(`position:absolute bottom:0 width:100% height:70px display:flex flex-direction:column`);",
      output: "clsx(`position:absolute bottom:0 display:flex flex-direction:column height:70px width:100%`);",
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: "cva({\n        primary: [\"position:absolute bottom:0 width:100% height:70px display:flex flex-direction:column\"],\n      })",
      output: "cva({\n        primary: [\"position:absolute bottom:0 display:flex flex-direction:column height:70px width:100%\"],\n      })",
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: "<div className={clsx(`position:absolute bottom:0 width:100% height:270px display:flex flex-direction:column`)}>clsx</div>",
      output: "<div className={clsx(`position:absolute bottom:0 display:flex flex-direction:column height:270px width:100%`)}>clsx</div>",
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: "\n        ctl(`\n          ${\n              !isDisabled &&\n              `\n              display:flex\n              top:0\n              border-width:0\n              `\n          }\n          ${\n              isDisabled &&\n              `\n              border-width:0\n              margin-inline:0\n              `\n          }\n          display:flex\n          padding-inline:0.125rem\n        `)\n      ",
      output: "\n        ctl(`\n          ${\n              !isDisabled &&\n              `\n              top:0\n              display:flex\n              border-width:0\n              `\n          }\n          ${\n              isDisabled &&\n              `\n              margin-inline:0\n              border-width:0\n              `\n          }\n          display:flex\n          padding-inline:0.125rem\n        `)\n      ",
      errors: [
        { messageId: 'invalidClassOrder' },
        { messageId: 'invalidClassOrder' },
      ],
    },
    {
      code: "<div className=\"padding-inline:0.125rem display:flex\">...</div>",
      output: "<div className=\"display:flex padding-inline:0.125rem\">...</div>",
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: "ctl(`${enabled && \"padding-inline:0.125rem display:flex\"}`)",
      output: "ctl(`${enabled && \"display:flex padding-inline:0.125rem\"}`)",
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: "ctl(`padding-inline:0.125rem display:flex`)",
      output: "ctl(`display:flex padding-inline:0.125rem`)",
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: "\n        ctl(`\n          padding-inline:0.125rem\n          display:flex\n        `)\n      ",
      output: "\n        ctl(`\n          display:flex\n          padding-inline:0.125rem\n        `)\n      ",
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: "\n        <div\n          className={clsx(\n            \"width:100% height:0.625rem border-radius:1e9em\",\n            name === \"white\"\n              ? \"margin:0.625rem display:flex\"\n              : undefined\n          )}\n        />\n      ",
      output: "\n        <div\n          className={clsx(\n            \"height:0.625rem width:100% border-radius:1e9em\",\n            name === \"white\"\n              ? \"display:flex margin:0.625rem\"\n              : undefined\n          )}\n        />\n      ",
      errors: [
        { messageId: 'invalidClassOrder' },
        { messageId: 'invalidClassOrder' },
      ],
    },
    {
      code: "\n        classnames([\n          'invalid width:4px@lg width:6px@sm',\n          ['width:0.75rem display:flex'],\n        ])",
      output: "\n        classnames([\n          'width:6px@sm width:4px@lg invalid',\n          ['display:flex width:0.75rem'],\n        ])",
      errors: [
        { messageId: 'invalidClassOrder' },
        { messageId: 'invalidClassOrder' },
      ],
    },
    {
      code: "\n        classnames({\n          invalid,\n          flex: myFlag,\n          'width:4px@lg width:6px@sm': resize\n        })",
      output: "\n        classnames({\n          invalid,\n          flex: myFlag,\n          'width:6px@sm width:4px@lg': resize\n        })",
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: "ctl(`padding:0.188rem border:3px|solid|var(--color-gray) margin:0.25rem height:1.5rem padding:0.25rem@lg display:flex border-width:2px margin:0.25rem@lg`)",
      output: "ctl(`display:flex height:1.5rem margin:0.25rem padding:0.188rem border-width:2px border:3px|solid|var(--color-gray) margin:0.25rem@lg padding:0.25rem@lg`)",
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: "<div class=\"a margin-top:0 margin-top:0@sm c d hello:world font:error\">Error class</div>",
      output: "<div class=\"margin-top:0 font:error hello:world margin-top:0@sm a c d\">Error class</div>",
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: "<div className=\"gap:0.938rem grid-cols(2) grid-cols(3)@2xs grid-cols(4)@sm grid-cols(5)@md padding:2.5rem\">order</div>",
      output: "<div className=\"grid-cols(2) gap:0.938rem padding:2.5rem grid-cols(3)@2xs grid-cols(4)@sm grid-cols(5)@md\">order</div>",
      errors: [
        {
          messageId: 'invalidClassOrder',
          column: 17,
          endColumn: 106,
          line: 1,
        },
      ],
    },
  ],
})
