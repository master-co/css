import rule from '../src/rules/sort-classes'
import { createTester } from './testers'
import { createPresetManifest } from './helpers/create-preset-manifest'
import { UtilityType } from '@master/css-schema/utility-type'

createTester({
  settings: {
    '@master/css': {
      classAttributes: ['test', 'className', 'class'],
      manifest: createPresetManifest({
        utilities: [
          {
            name: 'zDialog',
            type: UtilityType.Semantic,
            layer: 'components',
            rules: [
              { selector: '&', declarations: { 'z-index': 10000 } }
            ]
          }
        ],
      }),
    },
  },
}).run('sort classes', rule, {
  valid: [
    { code: `<div class="m:0.5rem p:0.5rem font-size:1.5rem bg-black fg-white">Simple, basic</div>` },
    { code: `<div class="mt:1.25rem card">Traditional class + syntax</div>` },
    {
      code: '<div className={ctl(`${live && \'bg-blue-10 bg-purple-40@dark r:0.313rem@sm\'} p:0.625rem w:100%`)}>ctl + exp</div>',
    },
    {
      code: '<div className={ctl(`${className} r:100% bg-blue-50 h:3rem w:3rem`)}>ctl + var</div>',
    },
    {
      code: '<div className={ctl(`${live && \'bg: black@dark white\'} p:0.625rem w:100%`)}>Space trim issue</div>',
    },
    { code: `<div class='m:0.5rem p:0.5rem font-size:1.5rem bg-black fg-white'>Simple quotes</div>` },
    { code: `<div class="p:0.5rem ">Extra space at the end</div>` },
    { code: `<div class="px:0.375rem p:0.313rem px:0.188rem@sm py:0.125rem@md p:0.25rem@lg">Native logical properties and condition order</div>` },
    {
      code: `ctl(\`
        flex
        container
        w:0.75rem
        w:0.375rem@sm
        w:0.25rem@lg
      \`)`,
    },
    { code: `<div class="w:0.75rem w:500px@lg">Allowed arbitrary value</div>` },
    {
      code: `<div class="bg-black:focus:hover@dark bg-gray-40:disabled:focus:hover@md@dark">Stackable variants</div>`,
    },
    { code: `<div className={clsx(\`abs bottom:0 flex flex-col h:270px w:100%\`)}>clsx</div>` },
    { code: `<div class="zDialog flex w:0.75rem">Number values</div>` },
    { code: `<div class="   flex  m:0.625rem   ">Extra spaces</div>` },
    {
      code: `
        <div className={\`\${yolo ? 'flex flex-col' : 'block'} rel overflow:hidden w:100%\`}>Issue #131</div>
      `,
    },
    { code: `<div class>No errors while typing</div>` },
    { code: `<div class="block flex\u3000my:1px">Do not treat full width space as class separator</div>` },
    { code: `<div class="m:0.625rem m:1.25rem m:1.875rem:hover m:2.5rem@dark">Collision class</div>` },
    {
      code: `
        export default () => (
          <Demo $py={0}>
            <div className="transition:transform|.2s transform:scale(1.1):hover">
              <Image
                src={mobileImage}
                className="untouchable"
                width="480"
                height="319"
                priority={true}
                alt="hello world"
              />
              <h1 className="abs inset:0 height:fit-content m:auto font-heavy font-size:7vw text-center fg-white animation:flash|3s|infinite blend:overlay font-size:2.5rem@xs">
                Hello, World!
              </h1>
            </div>
          </Demo>
        )
      `,
    },
    { code: `<div class="mt:0 font:error hello:world mt:0@sm a c d">Error class</div>` },
  ],
  invalid: [
    {
      code: `<div class="font-size:1.5rem fg-white m:0.5rem p:0.5rem bg-black">Classnames will be ordered</div>`,
      output: `<div class="m:0.5rem p:0.5rem font-size:1.5rem bg-black fg-white">Classnames will be ordered</div>`,
      errors: [{
        messageId: 'invalidClassOrder',
        data: {
          message: 'Sort classes into the expected order: "m:0.5rem p:0.5rem font-size:1.5rem bg-black fg-white".'
        }
      }],
    },
    {
      code: `<div class="flex uppercase m:0 m:0>li text-decoration:none>li>a px:0.25rem>li align-items:baseline fg-gray-30>li>a gap-x:1.75rem font-size:.75rem font-medium pb:0.375rem>li pt:1.25rem pt:0.625rem>li {bb:3px|solid|oklch(0%|0|none)}>li:has(>.router-link-active) {fg-black}>li:has(>.router-link-active)>a fg-gray-10>li>a:hover box-shadow:none>li>a:focus">Group</div>`,
      output: `<div class="flex align-items:baseline m:0 pt:1.25rem font-medium font-size:.75rem uppercase gap-x:1.75rem m:0>li px:0.25rem>li pb:0.375rem>li pt:0.625rem>li {bb:3px|solid|oklch(0%|0|none)}>li:has(>.router-link-active) text-decoration:none>li>a {fg-black}>li:has(>.router-link-active)>a fg-gray-30>li>a fg-gray-10>li>a:hover box-shadow:none>li>a:focus">Group</div>`,
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: `<div test="p:0.25rem px:0.438rem@sm p:0.5rem@lg py:0.313rem@sm">Enhancing readability with 'test' prop</div>`,
      output: `<div test="p:0.25rem py:0.313rem@sm px:0.438rem@sm p:0.5rem@lg">Enhancing readability with 'test' prop</div>`,
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: `<div class="grid grid-cols:1 grid-cols:2@sm px:0.5rem@sm py:0.75rem@sm gap:0.5rem py:1rem@md">:)...</div>`,
      output: `<div class="grid grid-cols:1 gap:0.5rem grid-cols:2@sm py:0.75rem@sm px:0.5rem@sm py:1rem@md">:)...</div>`,
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: '<div className={ctl(`${live && \'bg-black@dark bg-white\'} flex p:0.625rem`)}>Space trim issue with fix</div>',
      output: '<div className={ctl(`${live && \'bg-white bg-black@dark\'} flex p:0.625rem`)}>Space trim issue with fix</div>',
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: `<div class='bg-black@dark bg-white'>Simple quotes</div>`,
      output: `<div class='bg-white bg-black@dark'>Simple quotes</div>`,
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: `clsx('fg:#aaaaaa {content:\\'\\';block;h:100%;w:100%;abs}::after background-color:#ffffff')`,
      output: `clsx('background-color:#ffffff fg:#aaaaaa {content:\\'\\';block;h:100%;w:100%;abs}::after')`,
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: `<div class="w:0.75rem w:0.375rem@lg w:0.75rem">removeDuplicates</div>`,
      output: `<div class="w:0.75rem w:0.375rem@lg">removeDuplicates</div>`,
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: `<div class="w:0.75rem  w:0.375rem@lg  w:0.75rem">Single line dups + no head/tail spaces</div>`,
      output: `<div class="w:0.75rem  w:0.375rem@lg">Single line dups + no head/tail spaces</div>`,
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: `<div class=" w:0.75rem  w:0.375rem@lg   w:0.75rem">Single dups line + head spaces</div>`,
      output: `<div class=" w:0.75rem  w:0.375rem@lg">Single dups line + head spaces</div>`,
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: `<div class="w:0.75rem  w:0.375rem@lg   w:0.75rem ">Single line dups + tail spaces</div>`,
      output: `<div class="w:0.75rem  w:0.375rem@lg ">Single line dups + tail spaces</div>`,
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: `
        ctl(\`
          hidden
          w:0.375rem@sm
          block
          hidden
          flex
          block
          w:0.75rem
          flex
          block
          w:0.25rem@lg
          w:0.25rem@lg
        \`);
      `,
      output: `
        ctl(\`
          block
          flex
          hidden
          w:0.75rem
          w:0.375rem@sm
          w:0.25rem@lg
        \`);
      `,
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: `
        ctl(\`
          invalid
          w:0.375rem@sm
          flex
          container
          w:0.75rem
          w:0.25rem@lg
        \`);
      `,
      output: `
        ctl(\`
          flex
          container
          w:0.75rem
          w:0.375rem@sm
          w:0.25rem@lg
          invalid
        \`);
      `,
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: `<div class="w:0.75rem@sm w:320px">Allowed arbitrary value but incorrect order</div>`,
      output: `<div class="w:320px w:0.75rem@sm">Allowed arbitrary value but incorrect order</div>`,
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: `clsx(\`abs bottom:0 w:100% h:70px flex flex-col\`);`,
      output: `clsx(\`abs bottom:0 flex flex-col h:70px w:100%\`);`,
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: `cva({
        primary: ["abs bottom:0 w:100% h:70px flex flex-col"],
      })`,
      output: `cva({
        primary: ["abs bottom:0 flex flex-col h:70px w:100%"],
      })`,
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: `<div className={clsx(\`abs bottom:0 w:100% h:270px flex flex-col\`)}>clsx</div>`,
      output: `<div className={clsx(\`abs bottom:0 flex flex-col h:270px w:100%\`)}>clsx</div>`,
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: `
        ctl(\`
          \${
              !isDisabled &&
              \`
              flex
              top:0
              border-width:0
              \`
          }
          \${
              isDisabled &&
              \`
              border-width:0
              mx:0
              \`
          }
          flex
          px:0.125rem
        \`)
      `,
      output: `
        ctl(\`
          \${
              !isDisabled &&
              \`
              top:0
              flex
              border-width:0
              \`
          }
          \${
              isDisabled &&
              \`
              mx:0
              border-width:0
              \`
          }
          flex
          px:0.125rem
        \`)
      `,
      errors: [
        { messageId: 'invalidClassOrder' },
        { messageId: 'invalidClassOrder' },
      ],
    },
    {
      code: `<div className="px:0.125rem flex">...</div>`,
      output: `<div className="flex px:0.125rem">...</div>`,
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: `ctl(\`\${enabled && "px:0.125rem flex"}\`)`,
      output: `ctl(\`\${enabled && "flex px:0.125rem"}\`)`,
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: `ctl(\`px:0.125rem flex\`)`,
      output: `ctl(\`flex px:0.125rem\`)`,
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: `
        ctl(\`
          px:0.125rem
          flex
        \`)
      `,
      output: `
        ctl(\`
          flex
          px:0.125rem
        \`)
      `,
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: `
        <div
          className={clsx(
            "w:100% h:0.625rem rounded",
            name === "white"
              ? "m:0.625rem flex"
              : undefined
          )}
        />
      `,
      output: `
        <div
          className={clsx(
            "h:0.625rem w:100% rounded",
            name === "white"
              ? "flex m:0.625rem"
              : undefined
          )}
        />
      `,
      errors: [
        { messageId: 'invalidClassOrder' },
        { messageId: 'invalidClassOrder' },
      ],
    },
    {
      code: `
        classnames([
          'invalid w:4px@lg w:6px@sm',
          ['w:0.75rem flex'],
        ])`,
      output: `
        classnames([
          'w:6px@sm w:4px@lg invalid',
          ['flex w:0.75rem'],
        ])`,
      errors: [
        { messageId: 'invalidClassOrder' },
        { messageId: 'invalidClassOrder' },
      ],
    },
    {
      code: `
        classnames({
          invalid,
          flex: myFlag,
          'w:4px@lg w:6px@sm': resize
        })`,
      output: `
        classnames({
          invalid,
          flex: myFlag,
          'w:6px@sm w:4px@lg': resize
        })`,
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: `ctl(\`p:0.188rem b:3px|solid|var(--color-gray) m:0.25rem h:1.5rem p:0.25rem@lg flex border-width:2px m:0.25rem@lg\`)`,
      output: `ctl(\`flex h:1.5rem m:0.25rem p:0.188rem border-width:2px b:3px|solid|var(--color-gray) m:0.25rem@lg p:0.25rem@lg\`)`,
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: `<div class="a mt:0 mt:0@sm c d hello:world font:error">Error class</div>`,
      output: `<div class="mt:0 font:error hello:world mt:0@sm a c d">Error class</div>`,
      errors: [{ messageId: 'invalidClassOrder' }],
    },
    {
      code: `<div className="gap:0.938rem grid-cols:2 grid-cols:3@2xs grid-cols:4@sm grid-cols:5@md p:2.5rem">order</div>`,
      output: `<div className="grid-cols:2 gap:0.938rem p:2.5rem grid-cols:3@2xs grid-cols:4@sm grid-cols:5@md">order</div>`,
      errors: [
        {
          messageId: 'invalidClassOrder',
          column: 17,
          endColumn: 96,
          line: 1,
        },
      ],
    },
  ],
})
