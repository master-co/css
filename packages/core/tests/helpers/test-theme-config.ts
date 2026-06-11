import { UtilityType, type Config, type VariableDefinition } from '../../src'

function variable(namespace: string | undefined, key: string, value: string | number, mode?: string): VariableDefinition {
    return {
        ...(namespace ? { namespace } : {}),
        key,
        value,
        ...(mode ? { mode } : {})
    }
}

function variables(namespace: string, entries: Record<string, string | number>) {
    return Object.entries(entries).map(([key, value]) => variable(namespace, key, value))
}

const colorSteps = ['0', '5', '10', '20', '30', '40', '50', '60', '70', '80', '90', '95', '100']
const colorPalettes = [
    'stone',
    'gray',
    'grey',
    'slate',
    'brown',
    'orange',
    'amber',
    'yellow',
    'lime',
    'green',
    'beryl',
    'teal',
    'cyan',
    'sky',
    'blue',
    'indigo',
    'violet',
    'purple',
    'fuchsia',
    'pink',
    'crimson',
    'red'
]

const colorVariables: VariableDefinition[] = [
    variable('color', 'current', 'currentColor'),
    variable('color', 'white', 'oklch(100% 0 none)'),
    variable('color', 'black', 'oklch(0% 0 none)'),
    ...colorPalettes.flatMap((palette, paletteIndex) =>
        colorSteps.map((step, stepIndex) =>
            variable('color', `${palette}-${step}`, `oklch(${Math.max(12, 98 - stepIndex * 6)}% 0.${(paletteIndex % 9) + 1} ${paletteIndex * 16})`)
        )
    ),
    variable('color', 'line-neutral', '$color-grey-60'),
    variable('color', 'line-light', 'oklch(0% 0 none / 0.12)'),
    variable('color', 'line-lighter', 'oklch(0% 0 none / 0.09)'),
    variable('color', 'line-lightest', 'oklch(0% 0 none / 0.06)'),
    ...colorPalettes.map((palette) => variable('color', palette, `$color-${palette}-60`)),
    variable('color', 'text-invert', '$color-white'),
    variable('color', 'text-strong', '$color-grey-100'),
    variable('color', 'text-neutral', '$color-grey-70'),
    variable('color', 'text-lightest', '$color-grey-30'),
    variable('color', 'text-lighter', '$color-grey-40'),
    variable('color', 'text-light', '$color-grey-50'),
    ...colorPalettes.map((palette) => variable('color', `text-${palette}`, `$color-${palette}-60`)),
    variable('color', 'ground', '$color-grey-0', 'light'),
    variable('color', 'base', '$color-white', 'light'),
    variable('color', 'invert', '$color-black', 'light'),
    variable('color', 'ground', '$color-gray-100', 'dark'),
    variable('color', 'base', '$color-gray-95', 'dark'),
    variable('color', 'invert', '$color-white', 'dark')
]

const themeConfig: Config = {
    rootSize: 16,
    baseUnit: 4,
    defaultMode: 'light',
    modeTrigger: 'media',
    modes: ['light', 'dark'],
    variants: [
        { name: 'all', raw: '@all', atRules: ['@media all'] },
        { name: 'print', raw: '@print', atRules: ['@media print'] },
        { name: 'screen', raw: '@screen', atRules: ['@media screen'] },
        { name: 'speech', raw: '@speech', atRules: ['@media speech'] },
        { name: 'landscape', raw: '@landscape', atRules: ['@media (orientation:landscape)'] },
        { name: 'portrait', raw: '@portrait', atRules: ['@media (orientation:portrait)'] },
        { name: 'motion', raw: '@motion', atRules: ['@media (prefers-reduced-motion:no-preference)'] },
        { name: 'reduce-motion', raw: '@reduce-motion', atRules: ['@media (prefers-reduced-motion:reduce)'] },
        { name: 'base', raw: '@base', layer: 'base' },
        { name: 'default', raw: '@default', layer: 'defaults' },
        { name: 'component', raw: '@component', layer: 'components' },
        { name: 'utility', raw: '@utility', layer: 'utilities' },
        { name: 'start', raw: '@start', atRules: ['@starting-style'] },
        { name: 'first', raw: ':first', selector: '&:first-child' },
        { name: 'last', raw: ':last', selector: '&:last-child' },
        { name: 'nth-last', raw: ':nth-last', selector: '&:nth-last-child' },
        { name: 'even', raw: ':even', selector: '&:nth-child(2n)' },
        { name: 'odd', raw: ':odd', selector: '&:nth-child(odd)' },
        { name: 'nth', raw: ':nth', selector: '&:nth-child' },
        { name: 'only', raw: ':only', selector: '&:only-child' },
        { name: 'rtl', raw: ':rtl', selector: '&:dir(rtl)' },
        { name: 'ltr', raw: ':ltr', selector: '&:dir(ltr)' },
        { name: 'scrollbar', raw: '::scrollbar', selector: '&::-webkit-scrollbar' },
        { name: 'scrollbar-button', raw: '::scrollbar-button', selector: '&::-webkit-scrollbar-button' },
        { name: 'scrollbar-thumb', raw: '::scrollbar-thumb', selector: '&::-webkit-scrollbar-thumb' },
        { name: 'scrollbar-track', raw: '::scrollbar-track', selector: '&::-webkit-scrollbar-track' },
        { name: 'scrollbar-track-piece', raw: '::scrollbar-track-piece', selector: '&::-webkit-scrollbar-track-piece' },
        { name: 'scrollbar-corner', raw: '::scrollbar-corner', selector: '&::-webkit-scrollbar-corner' },
        { name: 'slider-thumb', raw: '::slider-thumb', selector: '&::-webkit-slider-thumb' },
        { name: 'slider-runnable-track', raw: '::slider-runnable-track', selector: '&::-webkit-slider-runnable-track' },
        { name: 'resizer', raw: '::resizer', selector: '&::-webkit-resizer' },
        { name: 'progress', raw: '::progress', selector: '&::-webkit-progress' },
        { name: 'vt', raw: '::vt', selector: '&::view-transition' },
        { name: 'vt-group', raw: '::vt-group', selector: '&::view-transition-group' },
        { name: 'vt-image-pair', raw: '::vt-image-pair', selector: '&::view-transition-image-pair' },
        { name: 'vt-old', raw: '::vt-old', selector: '&::view-transition-old' },
        { name: 'vt-new', raw: '::vt-new', selector: '&::view-transition-new' }
    ],
    animations: {
        fade: {
            '0%': { opacity: '0' },
            to: { opacity: '1' }
        },
        flash: {
            '0%,50%,to': { opacity: '1' },
            '25%,75%': { opacity: '0' }
        },
        float: {
            '0%': { transform: 'none' },
            '50%': { transform: 'translateY(-1.25rem)' },
            to: { transform: 'none' }
        },
        heart: {
            '0%': { transform: 'scale(1)' },
            '14%': { transform: 'scale(1.3)' },
            '28%': { transform: 'scale(1)' },
            '42%': { transform: 'scale(1.3)' },
            '70%': { transform: 'scale(1)' }
        },
        jump: {
            '0%,to': { transform: 'translateY(-25%)', 'animation-timing-function': 'cubic-bezier(.8,0,1,1)' },
            '50%': { transform: 'translateY(0)', 'animation-timing-function': 'cubic-bezier(0,0,.2,1)' }
        },
        ping: {
            '75%,to': { transform: 'scale(2)', opacity: '0' }
        },
        pulse: {
            '0%': { transform: 'none' },
            '50%': { transform: 'scale(1.05)' },
            to: { transform: 'none' }
        },
        rotate: {
            '0%': { transform: 'rotate(-360deg)' },
            to: { transform: 'none' }
        },
        shake: {
            '0%': { transform: 'none' },
            '6.5%': { transform: 'translateX(-6px) rotateY(-9deg)' },
            '18.5%': { transform: 'translateX(5px) rotateY(7deg)' },
            '31.5%': { transform: 'translateX(-3px) rotateY(-5deg)' },
            '43.5%': { transform: 'translateX(2px) rotateY(3deg)' },
            '50%': { transform: 'none' }
        },
        zoom: {
            '0%': { transform: 'scale(0)' },
            to: { transform: 'none' }
        }
    },
    utilities: [
        {
            name: 'gradient-text',
            type: UtilityType.Static,
            layer: 'utilities',
            declarations: {
                '-webkit-text-fill-color': 'transparent',
                'background-clip': 'text'
            }
        },
        {
            name: 'box-content',
            type: UtilityType.Static,
            layer: 'utilities',
            declarations: {
                'box-sizing': 'content-box'
            }
        },
        {
            name: 'box-border',
            type: UtilityType.Static,
            layer: 'utilities',
            declarations: {
                'box-sizing': 'border-box'
            }
        },
        {
            name: 'round',
            type: UtilityType.Static,
            layer: 'utilities',
            declarations: {
                'border-radius': '50%',
                'aspect-ratio': '1/1'
            }
        }
    ],
    variables: [
        variable(undefined, 'full', '100%'),
        variable(undefined, 'fit', 'fit-content'),
        variable(undefined, 'max', 'max-content'),
        variable(undefined, 'min', 'min-content'),
        ...variables('breakpoint', {
            '4xs': 360,
            '3xs': 480,
            '2xs': 600,
            xs: 768,
            sm: 834,
            md: 1024,
            lg: 1280,
            xl: 1440,
            '2xl': 1600,
            '3xl': 1920,
            '4xl': 2560
        }),
        ...variables('container', {
            '3xs': 256,
            '2xs': 288,
            xs: 320,
            sm: 384,
            md: 448,
            lg: 512,
            xl: 576,
            '2xl': 672,
            '3xl': 768,
            '4xl': 896,
            '5xl': 1024,
            '6xl': 1152,
            '7xl': 1280
        }),
        ...variables('font-family', {
            sans: '"Inter", $font-family-sans-fallback',
            serif: '$font-family-serif-fallback',
            mono: '$font-family-mono-fallback',
            'sans-fallback': 'ui-sans-serif, system-ui, sans-serif',
            'serif-fallback': 'ui-serif, Georgia, serif',
            'mono-fallback': 'ui-monospace, SFMono-Regular, monospace'
        }),
        ...variables('tracking', {
            tightest: '-0.072em',
            tighter: '-0.04em',
            tight: '-0.02em',
            normal: 0,
            wide: '0.02em',
            wider: '0.04em',
            widest: '0.12em'
        }),
        ...variables('leading', {
            xs: 1.2,
            sm: 1.4,
            md: 1.6,
            lg: 1.8,
            xl: 2
        }),
        ...variables('font-weight', {
            thin: 100,
            extralight: 200,
            light: 300,
            regular: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
            extrabold: 800,
            heavy: 900
        }),
        ...variables('font-size', {
            '3xs': 8,
            '2xs': 10,
            xs: 12,
            sm: 14,
            md: 16,
            lg: 18,
            xl: 20,
            '2xl': 24,
            '3xl': 32,
            '4xl': 36,
            '5xl': 40,
            '6xl': 48,
            '7xl': 60,
            '8xl': 72,
            '9xl': 96,
            '10xl': 128
        }),
        ...variables('radius', {
            xs: 2,
            sm: 4,
            md: 6,
            lg: 8,
            xl: 12,
            '2xl': 16,
            '3xl': 24,
            '4xl': 32
        }),
        ...variables('order', {
            first: -999999,
            last: 999999
        }),
        ...variables('spacing', {
            '4xs': 2,
            '3xs': 4,
            '2xs': 6,
            xs: 8,
            sm: 12,
            md: 16,
            lg: 24,
            xl: 32,
            '2xl': 48,
            '3xl': 64,
            '4xl': 96,
            '5xl': 128
        }),
        ...variables('duration', {
            fastest: '75ms',
            faster: '100ms',
            fast: '150ms',
            slow: '300ms',
            slower: '500ms',
            slowest: '800ms'
        }),
        ...variables('easing', {
            smooth: 'cubic-bezier(.4,0,.2,1)',
            soft: 'cubic-bezier(.33,1,.68,1)',
            crisp: 'cubic-bezier(.16,1,.3,1)',
            snap: 'cubic-bezier(.2,0,0,1)',
            accelerate: 'cubic-bezier(.4,0,1,1)',
            decelerate: 'cubic-bezier(0,0,.2,1)',
            overshoot: 'cubic-bezier(.34,1.56,.64,1)',
            rewind: 'cubic-bezier(.36,0,.66,-.56)',
            spring: 'cubic-bezier(.68,-.6,.32,1.6)'
        }),
        ...variables('animation', {
            fade: 'fade 1s infinite',
            flash: 'flash 1s infinite',
            float: 'float 3s ease-in-out infinite',
            heart: 'heart 1s infinite',
            jump: 'jump 1s infinite',
            ping: 'ping 1s infinite',
            pulse: 'pulse 1s infinite',
            rotate: 'rotate 1s linear infinite',
            shake: 'shake 1s infinite',
            zoom: 'zoom 1s infinite'
        }),
        ...variables('shadow', {
            xs: '0 1px 2px oklch(0% 0 none / .08)',
            sm: '0 1px 2px oklch(0% 0 none / .06)',
            md: '0 2px 4px -1px oklch(0% 0 none / .08)',
            lg: '0 4px 8px -2px oklch(0% 0 none / .08)',
            xl: '0 8px 16px -4px oklch(0% 0 none / .10)',
            '2xl': '0 16px 24px -8px oklch(0% 0 none / .12)'
        }),
        ...colorVariables
    ]
}

export default themeConfig
