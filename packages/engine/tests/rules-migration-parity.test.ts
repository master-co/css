import { describe, expect, test } from 'vitest'
import { createDefaultCSS } from './helpers/css-tester'

const migratedRuleExpectations = [
    {
        source: "packages/core/tests/rules/accent.test.ts",
        cases: [
            ["accent-color:transparent", "accent-color:transparent"],
        ]
    },
    {
        source: "packages/core/tests/rules/area.test.ts",
        cases: [
            ["full", "width:100%;height:100%"],
        ]
    },
    {
        source: "packages/core/tests/rules/background-clip.test.ts",
        cases: [
        ]
    },
    {
        source: "packages/core/tests/rules/background.test.ts",
        cases: [
            ["bg:light-dark(#000,#fff)", "background-color:light-dark(#000,#fff)"],
            ["bg:#fff", "background-color:#fff"],
            ["bg:transparent", "background-color:transparent"],
            ["bg:blue", "background-color:var(--color-blue)"],
            ["bg-clip-border", "background-clip:border-box"],
            ["bg:url('#test')", "background-image:url('#test')"],
            ["bg:linear-gradient(45deg,#f3ec78,#af4261)", "background-image:linear-gradient(45deg,#f3ec78,#af4261)"],
        ]
    },
    {
        source: "packages/core/tests/rules/border-color.test.ts",
        cases: [
            ["b:blue-50", "border-color:var(--color-blue-50)"],
            ["b:rgb(0,0,0,0.75)", "border-color:rgb(0,0,0,0.75)"],
            ["bb:rgb(0,0,0,0.75)", "border-bottom-color:rgb(0,0,0,0.75)"],
            ["bt:rgb(0,0,0,0.75)", "border-top-color:rgb(0,0,0,0.75)"],
            ["bl:blue-50", "border-left-color:var(--color-blue-50)"],
            ["bl:rgb(0,0,0,0.75)", "border-left-color:rgb(0,0,0,0.75)"],
            ["br:rgb(0,0,0,0.75)", "border-right-color:rgb(0,0,0,0.75)"],
        ]
    },
    {
        source: "packages/core/tests/rules/border-radius.test.ts",
        cases: [
            ["r:4x", "border-radius:1rem"],
            ["border-radius:1rem", "border-radius:1rem"],
            ["border-top-left-radius:4x", "border-top-left-radius:1rem"],
            ["border-top-right-radius:4x", "border-top-right-radius:1rem"],
            ["border-bottom-left-radius:4x", "border-bottom-left-radius:1rem"],
            ["border-bottom-right-radius:4x", "border-bottom-right-radius:1rem"],
        ]
    },
    {
        source: "packages/core/tests/rules/border-style.test.ts",
        cases: [
            ["b-solid", "border-style:solid"],
            ["border-style:solid", "border-style:solid"],
            ["bb-solid", "border-bottom-style:solid"],
            ["border-bottom-style:solid", "border-bottom-style:solid"],
            ["bt-solid", "border-top-style:solid"],
            ["border-top-style:solid", "border-top-style:solid"],
            ["bl-solid", "border-left-style:solid"],
            ["border-left-style:solid", "border-left-style:solid"],
            ["br-solid", "border-right-style:solid"],
            ["border-right-style:solid", "border-right-style:solid"],
            ["border:solid|1px", "border:solid 1px"],
        ]
    },
    {
        source: "packages/core/tests/rules/border-width.test.ts",
        cases: [
            ["border-width:1px", "border-width:1px"],
            ["border-bottom-width:1px", "border-bottom-width:1px"],
            ["border-top-width:1px", "border-top-width:1px"],
            ["border-left-width:1px", "border-left-width:1px"],
            ["border-right-width:1px", "border-right-width:1px"],
            ["border:2px|solid", "border:2px solid"],
        ]
    },
    {
        source: "packages/core/tests/rules/border.test.ts",
        cases: [
            ["border:transparent", "border:transparent"],
            ["border:1px|solid", "border:1px solid"],
            ["b-solid", "border-style:solid"],
            ["border:1rem|solid", "border:1rem solid"],
            ["b-none", "border-style:none"],
            ["border:unset", "border:unset"],
            ["border:inherit", "border:inherit"],
            ["border:initial", "border:initial"],
            ["border:revert", "border:revert"],
            ["border:revert-layer", "border:revert-layer"],
            ["border:calc(100%-1.25rem)|solid", "border:calc(100% - 1.25rem) solid"],
            ["b:1px", "border-width:1px"],
            ["bt:1px", "border-top-width:1px"],
            ["bx:1px", "border-inline-width:1px"],
            ["by:1px", "border-block-width:1px"],
            ["b:gray-20", "border-color:var(--color-gray-20)"],
            ["bx:gray-20", "border-inline-color:var(--color-gray-20)"],
            ["by:gray-20", "border-block-color:var(--color-gray-20)"],
            ["b:1px|solid", "border:1px solid"],
            ["border:1px|solid", "border:1px solid"],
            ["bt:1px|solid", "border-top:1px solid"],
            ["border-top:1px|solid", "border-top:1px solid"],
            ["bb:1px|solid", "border-bottom:1px solid"],
            ["border-bottom:1px|solid", "border-bottom:1px solid"],
            ["bl:1px|solid", "border-left:1px solid"],
            ["border-left:1px|solid", "border-left:1px solid"],
            ["br:1px|solid", "border-right:1px solid"],
            ["border-right:1px|solid", "border-right:1px solid"],
        ]
    },
    {
        source: "packages/core/tests/rules/box-shadow.test.ts",
        cases: [
            ["box-shadow:8px|8px|10px|#00b0de", "box-shadow:8px 8px 10px #00b0de"],
            ["box-shadow:8px|8px|10px|var(--my-shadow,#00b0de)", "box-shadow:8px 8px 10px var(--my-shadow,#00b0de)"],
            ["box-shadow:2xl", "box-shadow:var(--shadow-2xl)"],
        ]
    },
    {
        source: "packages/core/tests/rules/box.test.ts",
        cases: [
            ["box-content", "box-sizing:content-box"],
        ]
    },
    {
        source: "packages/core/tests/rules/caret.test.ts",
        cases: [
            ["caret-color:transparent", "caret-color:transparent"],
        ]
    },
    {
        source: "packages/core/tests/rules/color.test.ts",
        cases: [
            ["color:rgb(255,255,255)", "color:rgb(255,255,255)"],
            ["fg:#fff", "color:#fff"],
            ["fg:blue-50", "color:var(--color-blue-50)"],
            ["fg:transparent", "color:transparent"],
            ["fg:inherit", "color:inherit"],
            ["color:light-dark(#000,#fff)", "color:light-dark(#000,#fff)"],
        ]
    },
    {
        source: "packages/core/tests/rules/content.test.ts",
        cases: [
        ]
    },
    {
        source: "packages/core/tests/rules/counter.test.ts",
        cases: [
        ]
    },
    {
        source: "packages/core/tests/rules/font-size.test.ts",
        cases: [
            ["font:1rem", "font-size:1rem"],
            ["font:.5rem", "font-size:0.5rem"],
            ["font:min(.625rem,calc(1.5625rem-.625rem))", "font-size:min(0.625rem,calc(1.5625rem - 0.625rem))"],
        ]
    },
    {
        source: "packages/core/tests/rules/gap.test.ts",
        cases: [
            ["gap:4x", "gap:1rem"],
        ]
    },
    {
        source: "packages/core/tests/rules/logical-properties.test.ts",
        cases: [
            ["mys:4x", "margin-block-start:1rem"],
            ["mye:4x", "margin-block-end:1rem"],
            ["margin-block:4x", "margin-block:1rem"],
            ["pys:4x", "padding-block-start:1rem"],
            ["pye:4x", "padding-block-end:1rem"],
            ["padding-block:4x", "padding-block:1rem"],
            ["ixs:4x", "inset-inline-start:1rem"],
            ["ixe:4x", "inset-inline-end:1rem"],
            ["ix:4x", "inset-inline:1rem"],
            ["iys:4x", "inset-block-start:1rem"],
            ["iye:4x", "inset-block-end:1rem"],
            ["iy:4x", "inset-block:1rem"],
            ["contain-intrinsic-inline-size:4x", "contain-intrinsic-inline-size:1rem"],
            ["contain-intrinsic-block-size:4x", "contain-intrinsic-block-size:1rem"],
        ]
    },
    {
        source: "packages/core/tests/rules/margin.test.ts",
        cases: [
            ["ml:4x", "margin-left:1rem"],
            ["mr:4x", "margin-right:1rem"],
            ["mt:4x", "margin-top:1rem"],
            ["mb:4x", "margin-bottom:1rem"],
            ["m:4x", "margin:1rem"],
            ["m:1px", "margin:1px"],
            ["mxs:4x", "margin-inline-start:1rem"],
            ["mxe:4x", "margin-inline-end:1rem"],
            ["mx:4x", "margin-inline:1rem"],
        ]
    },
    {
        source: "packages/core/tests/rules/outline.test.ts",
        cases: [
            ["outline:transparent", "outline-color:transparent"],
            ["outline:gray-20", "outline-color:var(--color-gray-20)"],
            ["outline:1px|solid", "outline:1px solid"],
            ["outline-solid", "outline-style:solid"],
            ["outline-medium", "outline-width:medium"],
            ["outline-thick", "outline-width:thick"],
            ["outline-thin", "outline-width:thin"],
            ["outline:1rem|solid", "outline:1rem solid"],
            ["outline-none", "outline-style:none"],
            ["outline-auto", "outline-style:auto"],
            ["outline:medium", "outline:medium"],
            ["outline:unset", "outline:unset"],
            ["outline:inherit", "outline:inherit"],
            ["outline:initial", "outline:initial"],
            ["outline:revert", "outline:revert"],
            ["outline:revert-layer", "outline:revert-layer"],
            ["outline:auto|1px", "outline:auto 1px"],
        ]
    },
    {
        source: "packages/core/tests/rules/overflow.test.ts",
        cases: [
            ["overflow", "overflow:visible"],
            ["overflow:hidden", "overflow:hidden"],
            ["overflow:overlay", "overflow:overlay"],
        ]
    },
    {
        source: "packages/core/tests/rules/padding.test.ts",
        cases: [
            ["pl:4x", "padding-left:1rem"],
            ["pr:4x", "padding-right:1rem"],
            ["pt:4x", "padding-top:1rem"],
            ["pb:4x", "padding-bottom:1rem"],
            ["p:4x", "padding:1rem"],
            ["pxs:4x", "padding-inline-start:1rem"],
            ["pxe:4x", "padding-inline-end:1rem"],
            ["px:4x", "padding-inline:1rem"],
        ]
    },
    {
        source: "packages/core/tests/rules/scroll-margin.test.ts",
        cases: [
            ["scroll-ml:4x", "scroll-margin-left:1rem"],
            ["scroll-mr:4x", "scroll-margin-right:1rem"],
            ["scroll-mt:4x", "scroll-margin-top:1rem"],
            ["scroll-mb:4x", "scroll-margin-bottom:1rem"],
            ["scroll-m:4x", "scroll-margin:1rem"],
        ]
    },
    {
        source: "packages/core/tests/rules/scroll-padding.test.ts",
        cases: [
            ["scroll-pl:4x", "scroll-padding-left:1rem"],
            ["scroll-pr:4x", "scroll-padding-right:1rem"],
            ["scroll-pt:4x", "scroll-padding-top:1rem"],
            ["scroll-pb:4x", "scroll-padding-bottom:1rem"],
            ["scroll-p:4x", "scroll-padding:1rem"],
        ]
    },
    {
        source: "packages/core/tests/rules/scroll-snap-type.test.ts",
        cases: [
            ["snap-x", "scroll-snap-type:x"],
            ["scroll-snap-type:x", "scroll-snap-type:x"],
            ["scroll-snap-type:x|mandatory", "scroll-snap-type:x mandatory"],
        ]
    },
    {
        source: "packages/core/tests/rules/stroke.test.ts",
        cases: [
            ["stroke:.75!", "stroke-width:0.75!important"],
        ]
    },
    {
        source: "packages/core/tests/rules/text-overflow.test.ts",
        cases: [
            ["text-clip", "text-overflow:clip"],
            ["text-overflow:clip", "text-overflow:clip"],
            ["text-ellipsis", "text-overflow:ellipsis"],
            ["text-overflow:ellipsis", "text-overflow:ellipsis"],
        ]
    },
    {
        source: "packages/core/tests/rules/text-stroke-width.test.ts",
        cases: [
            ["text-stroke-width:thin", "-webkit-text-stroke-width:thin"],
        ]
    },
    {
        source: "packages/core/tests/rules/text-wrap.test.ts",
        cases: [
            ["text-wrap", "text-wrap:wrap"],
            ["text-nowrap", "text-wrap:nowrap"],
            ["text-balance", "text-wrap:balance"],
            ["text-pretty", "text-wrap:pretty"],
        ]
    },
    {
        source: "packages/core/tests/rules/text.test.ts",
        cases: [
            ["text:1.25rem", "font-size:1.25rem;line-height:max(1.8em - max(0rem, 1.25rem - 1rem) * 1.12, 1.25rem);letter-spacing:clamp(-.072em, calc((1.25rem - 1rem) * -.048), 0em)"],
            ["text:50%", "font-size:50%;line-height:max(1.8em - max(0rem, 50% - 1rem) * 1.12, 50%);letter-spacing:clamp(-.072em, calc((50% - 1rem) * -.048), 0em)"],
            ["text:blue", "color:var(--color-text-blue)"],
            ["text-stroke:#fff", "-webkit-text-stroke-color:#fff"],
            ["text-stroke:transparent", "-webkit-text-stroke-color:transparent"],
        ]
    },
    {
        source: "packages/core/tests/rules/transform.test.ts",
        cases: [
            ["transform-content", "transform-box:content-box"],
        ]
    },
    {
        source: "packages/core/tests/rules/width.test.ts",
        cases: [
            ["w:sm", "width:var(--container-sm)"],
            ["w:25%", "width:25%"],
            ["w:3xs", "width:var(--container-3xs)"],
            ["w:2xs", "width:var(--container-2xs)"],
            ["w:xs", "width:var(--container-xs)"],
            ["w:sm", "width:var(--container-sm)"],
            ["w:md", "width:var(--container-md)"],
            ["w:lg", "width:var(--container-lg)"],
            ["w:xl", "width:var(--container-xl)"],
            ["w:2xl", "width:var(--container-2xl)"],
            ["w:3xl", "width:var(--container-3xl)"],
            ["w:4xl", "width:var(--container-4xl)"],
            ["w:5xl", "width:var(--container-5xl)"],
            ["w:6xl", "width:var(--container-6xl)"],
            ["w:7xl", "width:var(--container-7xl)"],
        ]
    },
    {
        source: "packages/core/tests/rules/writing-mode.test.ts",
        cases: [
        ]
    },
] as const

describe.concurrent('migrated core rule expectations', () => {
    for (const { source, cases } of migratedRuleExpectations) {
        test(source, () => {
            const css = createDefaultCSS()
            for (const [className, expected] of cases) {
                expect(css.createRule(className)?.text, className).toContain(expected)
            }
        })
    }
})
