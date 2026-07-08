import presetColorNames from '~/internal/data/color-names'
import { COLOR_LEVELS } from '~/internal/data/color-palette'

export type Translate = (text: string) => string

export type HomeAccentClassName = 'bg:blue' | 'bg:cyan' | 'bg:green' | 'bg:red' | 'bg:yellow'

export type DeliveryModeIconId = 'bolt' | 'fileCode' | 'stack'

export type HomeInteractionId = typeof homeInteractions[keyof typeof homeInteractions]

export type HomeSectionId = typeof homeSections[keyof typeof homeSections]

export interface DesignSystemRowContent {
    title: string
    body: string
    gridClassName: string
    gridCount: number
    tiles?: readonly DesignSystemTileContent[]
    visual?: 'p3-palette'
}

export interface DesignSystemTileContent {
    title: string
    body: string
    gridColumnClassName?: string
    visual?: 'theme-modes' | 'theme-variables' | 'art-gallery' | 'native-css-primitives'
}

export interface DeliveryModeContent {
    title: string
    body: string
    href: string
    icon: DeliveryModeIconId
    accent: HomeAccentClassName
    signal: string
}

export interface AgentDiagnosticCardContent {
    title: string
    body: string
    visual?: 'invalid-classes'
}

export const sectionLabelClassName = 'font:sm tracking:widest uppercase font:semibold text:yellow'
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

export const themeVariablesCode = `@theme {
    --font-sans: "Inter"; /* font:sans */

    --spacing-md: 1rem;   /* p:md */
    --spacing-lg: 1.5rem; /* p:lg */

    --radius-lg: 0.5rem;  /* r:lg */
    --radius-xl: 0.75rem; /* r:xl */
}

@theme light {
    --color-surface-base: var(--color-neutral-0); /* surface:base */
    --color-text-body: var(--color-neutral-70);   /* text:body */
}

@theme dark {
    --color-surface-base: var(--color-gray-95);   /* surface:base */
    --color-text-body: var(--color-gray-30);      /* text:body */
}
`

export const nativeCssPrimitivesCode = `@import '@master/css';

@components {
    btn {
        @compose inline-flex items-center justify-center gap:xs;
        @compose h:10x px:md r:lg font:medium;
        color: white;
        background: var(--color-blue-60);

        &:hover {
            background: var(--color-blue-70);
        }

        @dark {
            background: var(--color-blue-50);
        }
    }

    btn-sm {
        @compose h:8x px:sm r:md font:sm;
    }
}
`

export const p3PaletteColorNames = [...presetColorNames].reverse()

export const p3PaletteTiers = [...COLOR_LEVELS].reverse()

export const designSystemRows = [
    {
        title: 'Tokenized themes',
        body: 'Bring modes and shared variables into one design-system vocabulary.',
        gridClassName: 'grid-cols:1 grid-cols:2@md',
        gridCount: 2,
        tiles: [
            {
                title: 'Theme modes without forks',
                body: 'Switch light, dark, and custom modes through the same tokens while components keep their markup.',
                visual: 'theme-modes'
            },
            {
                title: 'System-wide variables',
                body: 'Define color, spacing, radius, and type once, then reuse them across utilities, components, and modes.',
                visual: 'theme-variables'
            }
        ]
    },
    {
        title: 'Wide-gamut color system',
        body: 'Use vivid P3 palettes with a predictable tier scale, from deep anchors to bright interface accents.',
        gridClassName: 'grid-cols:1',
        gridCount: 1,
        visual: 'p3-palette'
    },
    {
        title: 'Modern CSS primitives',
        body: 'Connect layout, motion, and reusable CSS blocks inside the same interface system.',
        gridClassName: 'grid-cols:1 grid-cols:3@md',
        gridCount: 3,
        tiles: [
            {
                title: 'Layout and motion, together',
                body: 'Compose CSS Grid, responsive spans, animations, and View Transition selectors right beside the UI.',
                gridColumnClassName: 'grid-col-span:2@md',
                visual: 'art-gallery'
            },
            {
                title: 'Reusable native CSS',
                body: 'Package declarations, selectors, and modes into compact component classes.',
                visual: 'native-css-primitives'
            }
        ]
    }
] satisfies readonly DesignSystemRowContent[]

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

export const agentDiagnosticCards = [
    {
        title: 'Invalid classes',
        body: 'Catch malformed classes, invalid values, and unknown names when strict project policy is enabled.',
        visual: 'invalid-classes'
    },
    {
        title: 'Class order',
        body: 'Sort class strings into stable generated-rule order and remove duplicates so diffs stay reviewable.'
    },
    {
        title: 'Conflicting classes',
        body: 'Find declarations and overlapping shorthands that override each other in the same condition scope.'
    },
    {
        title: 'Canonical utilities',
        body: 'Prefer semantic utilities, property aliases, composition classes, and stable condition order.'
    },
    {
        title: 'Theme tokens',
        body: 'Suggest project tokens and enforce opt-in raw value policy for token-backed values.'
    },
    {
        title: 'Safe fix preview',
        body: 'Return fixable markup and @compose diagnostics as a reviewable preview before writes.'
    }
] satisfies readonly AgentDiagnosticCardContent[]
