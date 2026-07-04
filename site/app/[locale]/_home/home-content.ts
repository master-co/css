export type Translate = (text: string) => string

export type BentoAccentClassName = 'bg:blue' | 'bg:cyan' | 'bg:green' | 'bg:red' | 'bg:yellow'

export type BentoIconId = 'code' | 'desktop' | 'palette' | 'sparkles'

export type BentoVisualType = 'markup' | 'responsive' | 'states' | 'tokens'

export type DeliveryModeIconId = 'bolt' | 'fileCode' | 'stack'

export type HomeInteractionId = typeof homeInteractions[keyof typeof homeInteractions]

export type HomeSectionId = typeof homeSections[keyof typeof homeSections]

export interface BentoTileContent {
    title: string
    body: string
    href: string
    icon: BentoIconId
    accent: BentoAccentClassName
    span: string
    visual: BentoVisualType
    sample: readonly string[]
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
export const sectionHeadingClassName = 'max-w:32ch mx:0 mb:0 mt:md font:3xl font:regular leading:1.08 tracking:tight text:strong text-balance font:6xl@md'
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
    bentoTile: 'bento-tile',
    ctaLink: 'cta-link'
} as const

export const benchmarkChartColors = {
    cssVolume: ['bg:blue', 'bg:green', 'bg:yellow', 'bg:red'],
    domScaling: ['bg:green', 'bg:yellow', 'bg:red']
} as const

export const heroExampleClassNames = [
    'grid gap:lg p:lg r:lg surface:raised',
    'text:muted',
    'font:2xl text:strong',
    'px:md py:sm r:md bg:yellow fg:yellow-95'
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

export const bentoTiles = [
    {
        title: 'Markup-driven styling',
        body: 'Write the styling decision where the element lives, then let Master CSS emit only the rules in use.',
        href: '/guide/introduction',
        icon: 'code',
        accent: 'bg:yellow',
        span: 'grid-col-span:7@lg',
        visual: 'markup',
        sample: ['surface:raised', 'p:lg', 'text:strong']
    },
    {
        title: 'Tokens and modes',
        body: 'Theme variables, surfaces, text colors, and modes stay available from the same compact class language.',
        href: '/guide/variables-and-modes',
        icon: 'palette',
        accent: 'bg:green',
        span: 'grid-col-span:5@lg',
        visual: 'tokens',
        sample: ['bg:surface-base', 'text:muted', 'fg:accent']
    },
    {
        title: 'Responsive layout',
        body: 'Use grid, flex, breakpoints, and container queries without splitting the layout across files.',
        href: '/guide/layout-system',
        icon: 'desktop',
        accent: 'bg:blue',
        span: 'grid-col-span:5@lg',
        visual: 'responsive',
        sample: ['grid-cols:4', 'grid-cols:12@md', '@container']
    },
    {
        title: 'States and conditions',
        body: 'Selectors, media conditions, dark mode, and interaction states travel with the declaration they affect.',
        href: '/guide/state-selectors',
        icon: 'sparkles',
        accent: 'bg:cyan',
        span: 'grid-col-span:7@lg',
        visual: 'states',
        sample: ['bg:yellow:hover', 'hidden@print', 'fg:white@dark']
    }
] satisfies readonly BentoTileContent[]

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
