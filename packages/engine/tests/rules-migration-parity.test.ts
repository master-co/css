import { describe, expect, test } from 'vitest'
import { createDefaultCSS } from './helpers/css-tester'

const migratedRuleExpectations = [
    {
        source: "packages/core/tests/rules/accent.test.ts",
        cases: [
            ["accent:transparent", "accent-color:transparent"],
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
            ["bg-clip:text", "background-clip:text"],
        ]
    },
    {
        source: "packages/core/tests/rules/background.test.ts",
        cases: [
            ["bg:light-dark(#000,#fff)", "background-color:light-dark(#000,#fff)"],
            ["bg:#fff", "background-color:#fff"],
            ["bg:transparent", "background-color:transparent"],
            ["bg:line", "background-color:var(--color-line)"],
            ["bg-clip-border", "background-clip:border-box"],
            ["bg:url('#test')", "background-image:url('#test')"],
            ["gradient(45deg,#f3ec78,#af4261)", "background-image:linear-gradient(45deg,#f3ec78,#af4261)"],
        ]
    },
    {
        source: "packages/core/tests/rules/border-color.test.ts",
        cases: [
            ["b:subtle", "border-color:var(--color-line-subtle)"],
            ["b:blue-50", "border-color:var(--color-blue-50)"],
            ["b:rgb(0,0,0,0.75)", "border-color:rgb(0,0,0,0.75)"],
            ["bb:rgb(0,0,0,0.75)", "border-bottom-color:rgb(0,0,0,0.75)"],
            ["bt:rgb(0,0,0,0.75)", "border-top-color:rgb(0,0,0,0.75)"],
            ["bl:line-muted", "border-left-color:var(--color-line-muted)"],
            ["bl:rgb(0,0,0,0.75)", "border-left-color:rgb(0,0,0,0.75)"],
            ["br:rgb(0,0,0,0.75)", "border-right-color:rgb(0,0,0,0.75)"],
            ["bx:rgb(0,0,0,0.75)", "border-left-color:rgb(0,0,0,0.75);border-right-color:rgb(0,0,0,0.75)"],
        ]
    },
    {
        source: "packages/core/tests/rules/border-radius.test.ts",
        cases: [
            ["r:16", "border-radius:1rem"],
            ["border-radius:1rem", "border-radius:1rem"],
            ["rtl:16", "border-top-left-radius:1rem"],
            ["rtr:16", "border-top-right-radius:1rem"],
            ["rbl:16", "border-bottom-left-radius:1rem"],
            ["rbr:16", "border-bottom-right-radius:1rem"],
            ["rt:16", "border-top-left-radius:1rem;border-top-right-radius:1rem"],
            ["rb:16", "border-bottom-left-radius:1rem;border-bottom-right-radius:1rem"],
            ["rl:16", "border-top-left-radius:1rem;border-bottom-left-radius:1rem"],
            ["rr:16", "border-top-right-radius:1rem;border-bottom-right-radius:1rem"],
        ]
    },
    {
        source: "packages/core/tests/rules/border-style.test.ts",
        cases: [
            ["b:solid", "border-style:solid"],
            ["border:solid", "border-style:solid"],
            ["border-style:solid", "border-style:solid"],
            ["bb:solid", "border-bottom-style:solid"],
            ["border-bottom:solid", "border-bottom-style:solid"],
            ["border-bottom-style:solid", "border-bottom-style:solid"],
            ["bt:solid", "border-top-style:solid"],
            ["border-top:solid", "border-top-style:solid"],
            ["border-top-style:solid", "border-top-style:solid"],
            ["bl:solid", "border-left-style:solid"],
            ["border-left:solid", "border-left-style:solid"],
            ["border-left-style:solid", "border-left-style:solid"],
            ["br:solid", "border-right-style:solid"],
            ["border-right:solid", "border-right-style:solid"],
            ["border-right-style:solid", "border-right-style:solid"],
            ["bx:solid", "border-left-style:solid;border-right-style:solid"],
            ["border-x:solid", "border-left-style:solid;border-right-style:solid"],
            ["border-x-style:solid", "border-left-style:solid;border-right-style:solid"],
            ["border:solid|1", "border:solid 0.0625rem"],
        ]
    },
    {
        source: "packages/core/tests/rules/border-width.test.ts",
        cases: [
            ["b:16", "border-width:1rem"],
            ["border:16", "border-width:1rem"],
            ["border-width:16", "border-width:1rem"],
            ["bb:16", "border-bottom-width:1rem"],
            ["border-bottom:16", "border-bottom-width:1rem"],
            ["border-bottom-width:16", "border-bottom-width:1rem"],
            ["bt:16", "border-top-width:1rem"],
            ["border-top:16", "border-top-width:1rem"],
            ["border-top-width:16", "border-top-width:1rem"],
            ["bl:16", "border-left-width:1rem"],
            ["border-left:16", "border-left-width:1rem"],
            ["border-left-width:16", "border-left-width:1rem"],
            ["br:16", "border-right-width:1rem"],
            ["border-right:16", "border-right-width:1rem"],
            ["border-right-width:16", "border-right-width:1rem"],
            ["bx:16", "border-left-width:1rem;border-right-width:1rem"],
            ["border-x:16", "border-left-width:1rem;border-right-width:1rem"],
            ["border-x-width:16", "border-left-width:1rem;border-right-width:1rem"],
            ["border:16|solid", "border:1rem solid"],
        ]
    },
    {
        source: "packages/core/tests/rules/border.test.ts",
        cases: [
            ["border:transparent", "border-color:transparent"],
            ["border:1", "border-width:0.0625rem"],
            ["border:solid", "border-style:solid"],
            ["border:1rem|solid", "border:1rem solid"],
            ["border:none", "border-style:none"],
            ["border:auto", "border-style:auto"],
            ["border:unset", "border:unset"],
            ["border:inherit", "border:inherit"],
            ["border:initial", "border:initial"],
            ["border:revert", "border:revert"],
            ["border:revert-layer", "border:revert-layer"],
            ["border:auto|1", "border:auto 0.0625rem"],
            ["border:calc(100%-20)|solid", "border:calc(100% - 1.25rem) solid"],
            ["b:16|solid", "border:1rem solid"],
            ["border:16|solid", "border:1rem solid"],
            ["bt:16|solid", "border-top:1rem solid"],
            ["border-top:16|solid", "border-top:1rem solid"],
            ["bb:16|solid", "border-bottom:1rem solid"],
            ["border-bottom:16|solid", "border-bottom:1rem solid"],
            ["bl:16|solid", "border-left:1rem solid"],
            ["border-left:16|solid", "border-left:1rem solid"],
            ["br:16|solid", "border-right:1rem solid"],
            ["border-right:16|solid", "border-right:1rem solid"],
            ["bx:16|solid", "border-left:1rem solid;border-right:1rem solid"],
            ["border-x:16|solid", "border-left:1rem solid;border-right:1rem solid"],
            ["by:16|solid", "border-top:1rem solid;border-bottom:1rem solid"],
            ["border-y:16|solid", "border-top:1rem solid;border-bottom:1rem solid"],
        ]
    },
    {
        source: "packages/core/tests/rules/box-shadow.test.ts",
        cases: [
            ["box-shadow:8|8|10|#00b0de", "box-shadow:0.5rem 0.5rem 0.625rem #00b0de"],
            ["box-shadow:8|8|10|var(--my-shadow,#00b0de)", "box-shadow:0.5rem 0.5rem 0.625rem var(--my-shadow,#00b0de)"],
            ["box-shadow:2xl", "box-shadow:var(--shadow-2xl)"],
        ]
    },
    {
        source: "packages/core/tests/rules/box.test.ts",
        cases: [
            ["box-content", "box-sizing:content-box"],
            ["box-sizing:content-box", "box-sizing:content-box"],
        ]
    },
    {
        source: "packages/core/tests/rules/caret.test.ts",
        cases: [
            ["caret:transparent", "caret-color:transparent"],
        ]
    },
    {
        source: "packages/core/tests/rules/color.test.ts",
        cases: [
            ["color:rgb(255,255,255)", "color:rgb(255,255,255)"],
            ["fg:#fff", "color:#fff"],
            ["fg:strong", "color:var(--color-text-strong)"],
            ["fg:blue-50", "color:var(--color-blue-50)"],
            ["fg:transparent", "color:transparent"],
            ["fg:inherit", "color:inherit"],
            ["color:light-dark(#000,#fff)", "color:light-dark(#000,#fff)"],
        ]
    },
    {
        source: "packages/core/tests/rules/content.test.ts",
        cases: [
            ["content:'fo\\'o'", "content:'fo\\'o'"],
        ]
    },
    {
        source: "packages/core/tests/rules/counter.test.ts",
        cases: [
            ["counter-reset:section|0", "counter-reset:section 0"],
            ["counter-increment:section|-1", "counter-increment:section -1"],
            ["counter-set:section|4", "counter-set:section 4"],
        ]
    },
    {
        source: "packages/core/tests/rules/font-size.test.ts",
        cases: [
            ["font:16", "font-size:1rem"],
            ["font:.5", "font-size:0.03125rem"],
            ["font:min(10,calc(25-10))", "font-size:min(0.625rem,calc(1.5625rem - 0.625rem))"],
            ["font:1.2rem|\"Fira Sans\",sans-serif", "font:1.2rem \"Fira Sans\",sans-serif"],
        ]
    },
    {
        source: "packages/core/tests/rules/gap.test.ts",
        cases: [
            ["gap-x:16", "column-gap:1rem"],
            ["gap-y:16", "row-gap:1rem"],
            ["gap:16", "gap:1rem"],
        ]
    },
    {
        source: "packages/core/tests/rules/logical-properties.test.ts",
        cases: [
            ["mbs:16", "margin-block-start:1rem"],
            ["mbe:16", "margin-block-end:1rem"],
            ["margin-block:16", "margin-block:1rem"],
            ["pbs:16", "padding-block-start:1rem"],
            ["pbe:16", "padding-block-end:1rem"],
            ["padding-block:16", "padding-block:1rem"],
            ["iis:16", "inset-inline-start:1rem"],
            ["iie:16", "inset-inline-end:1rem"],
            ["ii:16", "inset-inline:1rem"],
            ["ibs:16", "inset-block-start:1rem"],
            ["ibe:16", "inset-block-end:1rem"],
            ["ib:16", "inset-block:1rem"],
            ["contain-intrinsic-inline-size:16", "contain-intrinsic-inline-size:1rem"],
            ["contain-intrinsic-block-size:16", "contain-intrinsic-block-size:1rem"],
            ["overflow-inline:hidden", "overflow-inline:hidden"],
            ["overflow-block:auto", "overflow-block:auto"],
            ["overscroll-behavior-inline:contain", "overscroll-behavior-inline:contain"],
            ["overscroll-behavior-block:none", "overscroll-behavior-block:none"],
        ]
    },
    {
        source: "packages/core/tests/rules/margin.test.ts",
        cases: [
            ["ml:16", "margin-left:1rem"],
            ["ml:4x", "margin-left:1rem"],
            ["mr:16", "margin-right:1rem"],
            ["mt:16", "margin-top:1rem"],
            ["mb:16", "margin-bottom:1rem"],
            ["m:16", "margin:1rem"],
            ["mx:16", "margin-left:1rem;margin-right:1rem"],
            ["my:16", "margin-top:1rem;margin-bottom:1rem"],
            ["margin-x:16", "margin-left:1rem;margin-right:1rem"],
            ["margin-y:16", "margin-top:1rem;margin-bottom:1rem"],
            ["mis:16", "margin-inline-start:1rem"],
            ["mie:16", "margin-inline-end:1rem"],
            ["mi:16", "margin-inline:1rem"],
        ]
    },
    {
        source: "packages/core/tests/rules/outline.test.ts",
        cases: [
            ["outline:transparent", "outline-color:transparent"],
            ["outline:line", "outline-color:var(--color-line)"],
            ["outline:$line", "outline-color:var(--color-line)"],
            ["outline:1", "outline-width:0.0625rem"],
            ["outline:solid", "outline-style:solid"],
            ["outline:1rem|solid", "outline:1rem solid"],
            ["outline:none", "outline-style:none"],
            ["outline:auto", "outline-style:auto"],
            ["outline:unset", "outline:unset"],
            ["outline:inherit", "outline:inherit"],
            ["outline:initial", "outline:initial"],
            ["outline:revert", "outline:revert"],
            ["outline:revert-layer", "outline:revert-layer"],
            ["outline:auto|1", "outline:auto 0.0625rem"],
        ]
    },
    {
        source: "packages/core/tests/rules/overflow.test.ts",
        cases: [
            ["overflow", "overflow:visible"],
            ["overflow:hidden", "overflow:hidden"],
            ["overflow:overlay", "overflow:overlay"],
            ["overflow-x:overlay", "overflow-x:overlay"],
            ["overflow-y:overlay", "overflow-y:overlay"],
        ]
    },
    {
        source: "packages/core/tests/rules/padding.test.ts",
        cases: [
            ["pl:16", "padding-left:1rem"],
            ["pr:16", "padding-right:1rem"],
            ["pt:16", "padding-top:1rem"],
            ["pb:16", "padding-bottom:1rem"],
            ["p:16", "padding:1rem"],
            ["px:16", "padding-left:1rem;padding-right:1rem"],
            ["py:16", "padding-top:1rem;padding-bottom:1rem"],
            ["padding-x:16", "padding-left:1rem;padding-right:1rem"],
            ["padding-y:16", "padding-top:1rem;padding-bottom:1rem"],
            ["pis:16", "padding-inline-start:1rem"],
            ["pie:16", "padding-inline-end:1rem"],
            ["pi:16", "padding-inline:1rem"],
        ]
    },
    {
        source: "packages/core/tests/rules/scroll-margin.test.ts",
        cases: [
            ["scroll-ml:16", "scroll-margin-left:1rem"],
            ["scroll-mr:16", "scroll-margin-right:1rem"],
            ["scroll-mt:16", "scroll-margin-top:1rem"],
            ["scroll-mb:16", "scroll-margin-bottom:1rem"],
            ["scroll-m:16", "scroll-margin:1rem"],
            ["scroll-mx:16", "scroll-margin-left:1rem;scroll-margin-right:1rem"],
            ["scroll-my:16", "scroll-margin-top:1rem;scroll-margin-bottom:1rem"],
            ["scroll-margin-x:16", "scroll-margin-left:1rem;scroll-margin-right:1rem"],
            ["scroll-margin-y:16", "scroll-margin-top:1rem;scroll-margin-bottom:1rem"],
        ]
    },
    {
        source: "packages/core/tests/rules/scroll-padding.test.ts",
        cases: [
            ["scroll-pl:16", "scroll-padding-left:1rem"],
            ["scroll-pr:16", "scroll-padding-right:1rem"],
            ["scroll-pt:16", "scroll-padding-top:1rem"],
            ["scroll-pb:16", "scroll-padding-bottom:1rem"],
            ["scroll-p:16", "scroll-padding:1rem"],
            ["scroll-px:16", "scroll-padding-left:1rem;scroll-padding-right:1rem"],
            ["scroll-py:16", "scroll-padding-top:1rem;scroll-padding-bottom:1rem"],
            ["scroll-padding-x:16", "scroll-padding-left:1rem;scroll-padding-right:1rem"],
            ["scroll-padding-y:16", "scroll-padding-top:1rem;scroll-padding-bottom:1rem"],
        ]
    },
    {
        source: "packages/core/tests/rules/scroll-snap-type.test.ts",
        cases: [
            ["scroll-snap:x", "scroll-snap-type:x"],
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
            ["text:clip", "text-overflow:clip"],
            ["text-overflow:clip", "text-overflow:clip"],
            ["text:ellipsis", "text-overflow:ellipsis"],
            ["text-overflow:ellipsis", "text-overflow:ellipsis"],
        ]
    },
    {
        source: "packages/core/tests/rules/text-stroke-width.test.ts",
        cases: [
            ["text-stroke:thin", "-webkit-text-stroke-width:thin"],
            ["text-stroke-width:thin", "text-stroke-width:thin"],
        ]
    },
    {
        source: "packages/core/tests/rules/text-wrap.test.ts",
        cases: [
            ["text:wrap", ".text\\:wrap{text-wrap:wrap}"],
            ["text:nowrap", ".text\\:nowrap{text-wrap:nowrap}"],
            ["text:balance", ".text\\:balance{text-wrap:balance}"],
            ["text:pretty", ".text\\:pretty{text-wrap:pretty}"],
        ]
    },
    {
        source: "packages/core/tests/rules/text.test.ts",
        cases: [
            ["text:20", "font-size:1.25rem;line-height:max(1.8em - max(0rem, 1.25rem - 1rem) * 1.12, 1.25rem);letter-spacing:clamp(-0.072em, calc((1.25rem - 1rem) * -0.048), 0em)"],
            ["text:50%", "font-size:50%;line-height:max(1.8em - max(0rem, 50% - 1rem) * 1.12, 50%);letter-spacing:clamp(-0.072em, calc((50% - 1rem) * -0.048), 0em)"],
            ["text:#fff", "-webkit-text-fill-color:#fff"],
            ["text:transparent", "-webkit-text-fill-color:transparent"],
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
            ["w:1/4", "width:25%"],
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
            ["writing:rl", "writing-mode:rl"],
        ]
    },
] as const

describe.concurrent('migrated core rule expectations', () => {
    for (const { source, cases } of migratedRuleExpectations) {
        test(source, () => {
            const css = createDefaultCSS()
            for (const [className, expected] of cases) {
                expect(css.create(className)?.text, className).toContain(expected)
            }
        })
    }
})
