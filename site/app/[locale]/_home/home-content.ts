export type Translate = (text: string) => string

export type BentoAccentClassName = 'bg:blue' | 'bg:cyan' | 'bg:green' | 'bg:red' | 'bg:yellow'

export type BentoIconId = 'code' | 'desktop' | 'layers' | 'palette' | 'sparkles' | 'tools'

export type BentoVisualType = 'delivery' | 'markup' | 'responsive' | 'states' | 'tokens' | 'tooling'

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

export const sectionLabelClassName = 'font:sm tracking:wider text:muted'
export const sectionHeadingClassName = 'max-w:32ch mx:0 mb:0 mt:md font:3xl font:regular leading:1.08 tracking:tight text:strong text-balance font:6xl@md'
export const sectionBodyClassName = 'max-w:72ch mb:0 mt:lg text:lg text:muted'

export const homeSections = {
    hero: 'hero',
    cssCost: 'css-cost',
    designSystem: 'design-system',
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
    },
    {
        title: 'Delivery modes',
        body: 'Choose runtime, static, server, or progressive rendering from the same styling vocabulary.',
        href: '/guide/rendering-modes',
        icon: 'layers',
        accent: 'bg:red',
        span: 'grid-col-span:6@lg',
        visual: 'delivery',
        sample: ['Runtime', 'Static', 'Progressive']
    },
    {
        title: 'Editor and linting',
        body: 'Completion, diagnostics, sorting, and class policy checks keep large teams working in one syntax.',
        href: '/guide/language-service',
        icon: 'tools',
        accent: 'bg:green',
        span: 'grid-col-span:6@lg',
        visual: 'tooling',
        sample: ['completion', 'diagnostics', 'sort']
    }
] satisfies readonly BentoTileContent[]
