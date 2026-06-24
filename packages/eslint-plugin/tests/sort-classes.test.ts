import rule from '../src/rules/sort-classes'
import { createTester } from './testers'
import { createPresetManifest } from './helpers/create-preset-manifest'
import UtilityType from '@master/css-schema/utility-type'

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
        { code: `<div class="m:2x p:2x bg:black fg:white font:1.5rem">Simple, basic</div>` },
        { code: `<div class="mt:5x card">Traditional class + syntax</div>` },
        {
            code: '<div className={ctl(`${live && \'bg:blue-10 bg:purple-40@dark r:0.313rem@sm\'} p:0.625rem w:full`)}>ctl + exp</div>',
        },
        {
            code: '<div className={ctl(`${className} r:100% bg:blue-50 h:12x w:12x`)}>ctl + var</div>',
        },
        {
            code: '<div className={ctl(`${live && \'bg: black@dark white\'} p:0.625rem w:full`)}>Space trim issue</div>',
        },
        { code: `<div class='m:2x p:2x bg:black fg:white font:1.5rem'>Simple quotes</div>` },
        { code: `<div class="p:2x ">Extra space at the end</div>` },
        { code: `<div class="p:0.313rem px:0.375rem px:0.188rem@sm py:0.125rem@md p:1x@lg">'p', then 'px' then 'py'</div>` },
        {
            code: `ctl(\`
                container
                flex
                w:3x
                w:0.375rem@sm
                w:1x@lg
            \`)`,
        },
        { code: `<div class="w:3x w:500px@lg">Allowed arbitrary value</div>` },
        {
            code: `<div class="bg:black:focus:hover@dark bg:gray-40:disabled:focus:hover@md@dark">Stackable variants</div>`,
        },
        { code: `<div className={clsx(\`abs flex flex-col bottom:0 h:270px w:full\`)}>clsx</div>` },
        { code: `<div class="zDialog flex w:3x">Number values</div>` },
        { code: `<div class="   flex  m:0.625rem   ">Extra spaces</div>` },
        {
            code: `
                <div className={\`\${yolo ? 'flex flex-col' : 'block'} rel overflow:hidden w:full\`}>Issue #131</div>
            `,
        },
        { code: `<div class>No errors while typing</div>` },
        { code: `<div class="block flex\u3000my:1px">Do not treat full width space as class separator</div>` },
        { code: `<div class="m:0.625rem m:5x m:1.875rem:hover m:10x@dark">Collision class</div>` },
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
                            <h1 className="abs text-center animation:flash|3s|infinite inset:0 m:auto fg:white font:7vw font:heavy height:fit font:2.5rem@xs blend:overlay">
                                Hello, World!
                            </h1>
                        </div>
                    </Demo>
                )
            `,
        },
        {
            code: `<div class="h:full w:full flex-col:hover_:where(.promotions)@md hidden:hover_:where(.hidden-on-hover)@md hidden!:not(:hover)_:where(.visible-on-hover)@md hidden!_:where(.visible-on-hover)@<md {abs;z:10;h:auto}:hover@md">Issue #377 hover visibility chain</div>`,
        },
        {
            code: `<button class="flex items-center gap:2x px:0 w:full fg:#2B88FD:not(:disabled) fg:#999:disabled">Issue #377 disabled colors</button>`,
        },
        { code: `<div class="mt:0 mt:0@sm a c d font:error hello:world">Error class</div>` },
    ],
    invalid: [
        {
            code: `<div class="font:1.5rem fg:white m:2x p:2x bg:black">Classnames will be ordered</div>`,
            output: `<div class="m:2x p:2x bg:black fg:white font:1.5rem">Classnames will be ordered</div>`,
            errors: [{ messageId: 'invalidClassOrder' }],
        },
        {
            code: `<div class="flex uppercase m:0 m:0>li text-decoration:none>li>a px:1x>li align-items:baseline fg:gray-30>li>a gap-x:7x font:.75rem font:medium pb:0.375rem>li pt:5x pt:0.625rem>li {bb:3px|solid|black}>li:has(>.router-link-active) {fg:black}>li:has(>.router-link-active)>a fg:gray-10>li>a:hover box-shadow:none>li>a:focus">Group</div>`,
            output: `<div class="flex uppercase m:0 align-items:baseline font:.75rem font:medium gap-x:7x pt:5x {bb:3px|solid|black}>li:has(>.router-link-active) {fg:black}>li:has(>.router-link-active)>a m:0>li px:1x>li text-decoration:none>li>a fg:gray-30>li>a pb:0.375rem>li pt:0.625rem>li fg:gray-10>li>a:hover box-shadow:none>li>a:focus">Group</div>`,
            errors: [{ messageId: 'invalidClassOrder' }],
        },
        {
            code: `<div test="p:1x px:0.438rem@sm p:2x@lg py:0.313rem@sm">Enhancing readability with 'test' prop</div>`,
            output: `<div test="p:1x px:0.438rem@sm py:0.313rem@sm p:2x@lg">Enhancing readability with 'test' prop</div>`,
            errors: [{ messageId: 'invalidClassOrder' }],
        },
        {
            code: `<div class="grid grid-cols:1 grid-cols:2@sm px:2x@sm py:3x@sm gap:2x py:4x@md">:)...</div>`,
            output: `<div class="grid gap:2x grid-cols:1 px:2x@sm py:3x@sm grid-cols:2@sm py:4x@md">:)...</div>`,
            errors: [{ messageId: 'invalidClassOrder' }],
        },
        {
            code: '<div className={ctl(`${live && \'bg:black@dark bg:white\'} flex p:0.625rem`)}>Space trim issue with fix</div>',
            output: '<div className={ctl(`${live && \'bg:white bg:black@dark\'} flex p:0.625rem`)}>Space trim issue with fix</div>',
            errors: [{ messageId: 'invalidClassOrder' }],
        },
        {
            code: `<div class='bg:black@dark bg:white'>Simple quotes</div>`,
            output: `<div class='bg:white bg:black@dark'>Simple quotes</div>`,
            errors: [{ messageId: 'invalidClassOrder' }],
        },
        {
            code: `clsx('fg:#aaaaaa {content:\\'\\';block;h:full;w:full;abs}::after bg:#ffffff')`,
            output: `clsx('bg:#ffffff fg:#aaaaaa {content:\\'\\';block;h:full;w:full;abs}::after')`,
            errors: [{ messageId: 'invalidClassOrder' }],
        },
        {
            code: `<div class="w:3x w:0.375rem@lg w:3x">removeDuplicates</div>`,
            output: `<div class="w:3x w:0.375rem@lg">removeDuplicates</div>`,
            errors: [{ messageId: 'invalidClassOrder' }],
        },
        {
            code: `<div class="w:3x  w:0.375rem@lg  w:3x">Single line dups + no head/tail spaces</div>`,
            output: `<div class="w:3x  w:0.375rem@lg">Single line dups + no head/tail spaces</div>`,
            errors: [{ messageId: 'invalidClassOrder' }],
        },
        {
            code: `<div class=" w:3x  w:0.375rem@lg   w:3x">Single dups line + head spaces</div>`,
            output: `<div class=" w:3x  w:0.375rem@lg">Single dups line + head spaces</div>`,
            errors: [{ messageId: 'invalidClassOrder' }],
        },
        {
            code: `<div class="w:3x  w:0.375rem@lg   w:3x ">Single line dups + tail spaces</div>`,
            output: `<div class="w:3x  w:0.375rem@lg ">Single line dups + tail spaces</div>`,
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
                    w:3x
                    flex
                    block
                    w:1x@lg
                    w:1x@lg
                \`);
            `,
            output: `
                ctl(\`
                    block
                    flex
                    hidden
                    w:3x
                    w:0.375rem@sm
                    w:1x@lg
                \`);
            `,
            errors: [{ messageId: 'invalidClassOrder' }],
        },
        {
            code: `
                ctl(\`
                    invalid
                    w:0.375rem@sm
                    container
                    w:3x
                    flex
                    w:1x@lg
                \`);
            `,
            output: `
                ctl(\`
                    container
                    flex
                    w:3x
                    w:0.375rem@sm
                    w:1x@lg
                    invalid
                \`);
            `,
            errors: [{ messageId: 'invalidClassOrder' }],
        },
        {
            code: `<div class="w:3x@sm w:320px">Allowed arbitrary value but incorrect order</div>`,
            output: `<div class="w:320px w:3x@sm">Allowed arbitrary value but incorrect order</div>`,
            errors: [{ messageId: 'invalidClassOrder' }],
        },
        {
            code: `clsx(\`abs bottom:0 w:full h:70px flex flex-col\`);`,
            output: `clsx(\`abs flex flex-col bottom:0 h:70px w:full\`);`,
            errors: [{ messageId: 'invalidClassOrder' }],
        },
        {
            code: `cva({
                primary: ["abs bottom:0 w:full h:70px flex flex-col"],
            })`,
            output: `cva({
                primary: ["abs flex flex-col bottom:0 h:70px w:full"],
            })`,
            errors: [{ messageId: 'invalidClassOrder' }],
        },
        {
            code: `<div className={clsx(\`abs bottom:0 w:full h:270px flex flex-col\`)}>clsx</div>`,
            output: `<div className={clsx(\`abs flex flex-col bottom:0 h:270px w:full\`)}>clsx</div>`,
            errors: [{ messageId: 'invalidClassOrder' }],
        },
        {
            code: `
                ctl(\`
                    \${
                            !isDisabled &&
                            \`
                            top:0
                            flex
                            b:0
                            \`
                    }
                    \${
                            isDisabled &&
                            \`
                            mx:0
                            b:0
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
                            flex
                            b:0
                            top:0
                            \`
                    }
                    \${
                            isDisabled &&
                            \`
                            b:0
                            mx:0
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
                        "w:full h:0.625rem rounded",
                        name === "white"
                            ? "m:0.625rem flex"
                            : undefined
                    )}
                />
            `,
            output: `
                <div
                    className={clsx(
                        "rounded h:0.625rem w:full",
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
                    ['w:3x flex'],
                ])`,
            output: `
                classnames([
                    'w:6px@sm w:4px@lg invalid',
                    ['flex w:3x'],
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
            code: `ctl(\`p:0.188rem b:3px|solid|gray m:1x h:6x p:1x@lg flex b:2px m:1x@lg\`)`,
            output: `ctl(\`flex b:2px b:3px|solid|gray m:1x p:0.188rem h:6x m:1x@lg p:1x@lg\`)`,
            errors: [{ messageId: 'invalidClassOrder' }],
        },
        {
            code: `<div class="a mt:0 mt:0@sm c d hello:world font:error">Error class</div>`,
            output: `<div class="mt:0 mt:0@sm a c d font:error hello:world">Error class</div>`,
            errors: [{ messageId: 'invalidClassOrder' }],
        },
        {
            code: `<div className="gap:0.938rem grid-cols:2 grid-cols:3@2xs grid-cols:4@sm grid-cols:5@md p:10x">order</div>`,
            output: `<div className="gap:0.938rem p:10x grid-cols:2 grid-cols:3@2xs grid-cols:4@sm grid-cols:5@md">order</div>`,
            errors: [
                {
                    messageId: 'invalidClassOrder',
                    column: 17,
                    endColumn: 93,
                    line: 1,
                },
            ],
        },
    ],
})
