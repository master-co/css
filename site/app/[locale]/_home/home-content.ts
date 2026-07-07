import presetColorNames from '~/internal/data/color-names'
import { COLOR_LEVELS } from '~/internal/data/color-palette'

export type Translate = (text: string) => string

export type BentoAccentClassName = 'bg:blue' | 'bg:cyan' | 'bg:green' | 'bg:red' | 'bg:yellow'

export type DeliveryModeIconId = 'bolt' | 'fileCode' | 'stack'

export type HomeInteractionId = typeof homeInteractions[keyof typeof homeInteractions]

export type HomeSectionId = typeof homeSections[keyof typeof homeSections]

export interface BentoRowContent {
    title: string
    body: string
    gridClassName: string
    gridCount: number
    tiles?: readonly BentoTileContent[]
    visual?: 'p3-palette'
}

export interface BentoTileContent {
    title: string
    body: string
    visual?: 'theme-modes'
}

export interface DeliveryModeContent {
    title: string
    body: string
    href: string
    icon: DeliveryModeIconId
    accent: BentoAccentClassName
    signal: string
}

export interface DiagnosticSignalContent {
    title: string
    body: string
    accent: BentoAccentClassName
    status: string
}

export const sectionLabelClassName = 'font:sm tracking:widest uppercase font:semibold'
export const sectionHeadingClassName = 'max-w:32ch mx:0 mb:0 mt:md font:3xl font:regular leading:1.08 tracking:tight text:strong text-balance font:5xl@md'
export const sectionBodyClassName = 'max-w:72ch mb:0 mt:lg text:lg text:muted'

export const homeSections = {
    hero: 'hero',
    cssCost: 'css-cost',
    designSystem: 'design-system',
    deliveryModes: 'delivery-modes',
    codeDiagnostics: 'code-diagnostics',
    getStarted: 'get-started'
} as const

export const homeInteractions = {
    benchmarkRow: 'benchmark-row',
    ctaLink: 'cta-link'
} as const

export const benchmarkChartColors = {
    cssVolume: ['bg:blue', 'bg:green', 'bg:yellow', 'bg:red'],
    domScaling: ['bg:green', 'bg:yellow', 'bg:red']
} as const

export const heroExampleClassNames = [
    'grid gap:lg p:lg r:3xl surface:raised',
    'text:muted',
    'font:2xl text:strong',
    'px:md py:sm r:xl bg:yellow fg:yellow-95'
] as const

export const heroExampleCode = `
<article class="${heroExampleClassNames[0]}">
  <p class="${heroExampleClassNames[1]}">Design system surface</p>
  <h2 class="${heroExampleClassNames[2]}">Agent-ready UI</h2>
  <button class="${heroExampleClassNames[3]}">
    Ship interface
  </button>
</article>
`

export const p3PaletteColorNames = [...presetColorNames].reverse()

export const p3PaletteTiers = [...COLOR_LEVELS].reverse()

export const bentoRows = [
    {
        title: 'Two-column grid',
        body: 'A simple placeholder grid for paired content, preview panels, or side-by-side feature blocks.',
        gridClassName: 'grid-cols:1 grid-cols:2@md',
        gridCount: 2,
        tiles: [
            {
                title: 'Theme modes',
                body: 'Flip the same tokens between light, dark, and custom modes without changing the markup.',
                visual: 'theme-modes'
            },
            {
                title: 'Two-column grid 2',
                body: 'A simple placeholder grid for paired content, preview panels, or side-by-side feature blocks.'
            }
        ]
    },
    {
        title: 'High-saturation P3 colors',
        body: 'Vivid preset hue families keep a consistent tier scale from deep anchors to bright interface accents.',
        gridClassName: 'grid-cols:1',
        gridCount: 1,
        visual: 'p3-palette'
    },
    {
        title: 'Three-column grid',
        body: 'A compact placeholder grid for repeated items with equal height and consistent spacing.',
        gridClassName: 'grid-cols:1 grid-cols:3@md',
        gridCount: 3
    }
] satisfies readonly BentoRowContent[]

export const deliveryModes = [
    {
        title: 'Runtime rendering',
        body: 'Generate rules from live DOM changes while teams keep moving.',
        href: '/guide/rendering-modes#runtime-rendering',
        icon: 'bolt',
        accent: 'bg:yellow',
        signal: 'Live DOM'
    },
    {
        title: 'Static rendering',
        body: 'Scan source once and ship a compact CSS file with production builds.',
        href: '/guide/rendering-modes#static-rendering',
        icon: 'fileCode',
        accent: 'bg:blue',
        signal: 'Build CSS'
    },
    {
        title: 'Progressive rendering',
        body: 'Render first-response CSS, then let runtime hydration adopt late UI states.',
        href: '/guide/rendering-modes#progressive-rendering',
        icon: 'stack',
        accent: 'bg:red',
        signal: 'Hybrid'
    }
] satisfies readonly DeliveryModeContent[]

export const diagnosticSignals = [
    {
        title: 'Project scan',
        body: 'Find stylesheet entries, source coverage, and missing CSS before edits start.',
        accent: 'bg:blue',
        status: 'context'
    },
    {
        title: 'Class diagnostics',
        body: 'Catch invalid classes, conflicts, non-canonical syntax, and unstable order.',
        accent: 'bg:yellow',
        status: 'lint'
    },
    {
        title: 'Safe fix preview',
        body: 'Return a reviewable diff before an agent writes fixes back to the workspace.',
        accent: 'bg:green',
        status: 'preview'
    }
] satisfies readonly DiagnosticSignalContent[]
