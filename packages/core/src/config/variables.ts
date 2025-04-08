import colors from '@master/colors'
import extend from '@techor/extend'

const _variables = {
    full: '100%',
    fit: 'fit-content',
    max: 'max-content',
    min: 'min-content',
    'font-family': {
        mono: [
            'ui-monospace',
            'SFMono-Regular',
            'Menlo',
            'Monaco',
            'Consolas',
            'Liberation Mono',
            'Courier New',
            'monospace'
        ],
        sans: [
            'ui-sans-serif',
            'system-ui',
            '-apple-system',
            'BlinkMacSystemFont',
            'Segoe UI',
            'Roboto',
            'Helvetica Neue',
            'Arial',
            'Noto Sans',
            'sans-serif',
            'Apple Color Emoji',
            'Segoe UI Emoji',
            'Segoe UI Symbol',
            'Noto Color Emoji'
        ],
        serif: [
            'ui-serif',
            'Georgia',
            'Cambria',
            'Times New Roman',
            'Times',
            'serif'
        ]
    },
    'font-weight': {
        thin: 100,
        extralight: 200,
        light: 300,
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
        heavy: 900
    },
    'flex-direction': {
        col: 'column',
        'col-reverse': 'column-reverse'
    },
    'box-sizing': {
        content: 'content-box',
        border: 'border-box'
    },
    position: {
        abs: 'absolute',
        rel: 'relative'
    },
    'transform-box': {
        content: 'content-box',
        border: 'border-box',
        padding: 'padding-box',
        fill: 'fill-box',
        stroke: 'stroke-box',
        view: 'view-box'
    },
    'animation-direction': {
        alt: 'alternate',
        'alt-reverse': 'alternate-reverse'
    },
    'background-clip': {
        content: 'content-box',
        border: 'border-box',
        padding: 'padding-box'
    },
    'background-origin': {
        content: 'content-box',
        border: 'border-box',
        padding: 'padding-box'
    },
    order: {
        first: -999999,
        last: 999999
    },
    'shape-outside': {
        content: 'content-box',
        border: 'border-box',
        padding: 'padding-box',
        margin: 'margin-box'
    },
    'clip-path': {
        content: 'content-box',
        border: 'border-box',
        padding: 'padding-box',
        margin: 'margin-box',
        fill: 'fill-box',
        stroke: 'stroke-box',
        view: 'view-box'
    },
    current: 'currentColor',
    frame: {
        neutral: {
            '@light': '$(slate-60)',
            '@dark': '$(gray-30)'
        },
        light: {
            '@light': '$(slate-60)/.2',
            '@dark': '$(gray-30)/.2'
        },
        lighter: {
            '@light': '$(slate-60)/.16',
            '@dark': '$(gray-30)/.16'
        },
        lightest: {
            '@light': '$(slate-60)/.12',
            '@dark': '$(gray-30)/.12'
        }
    },
    // from figma
    white: '#ffffff',
    black: '#000000',
    base: {
        '@light': '$(white)',
        '@dark': '$(gray-95)',
    },
    canvas: {
        '@light': '$(slate-5)',
        '@dark': '$(gray-90)',
    },
    surface: {
        '@light': '$(white)',
        '@dark': '$(gray-80)',
    },
    invert: {
        '@light': '$(black)',
        '@dark': '$(white)',
    },
    gray: {
        '@light': '$(gray-30)',
        '@dark': '$(gray-40)',
        active: {
            '@light': '$(gray-40)',
            '@dark': '$(gray-30)',
        },
        text: {
            '@light': '$(gray-90)',
            '@dark': '$(gray-95)',
        },
    },
    slate: {
        '@light': '$(slate-30)',
        '@dark': '$(slate-40)',
        active: {
            '@light': '$(slate-40)',
            '@dark': '$(slate-30)',
        },
        text: {
            '@light': '$(slate-90)',
            '@dark': '$(slate-95)',
        },
    },
    brown: {
        '@light': '$(brown-40)',
        '@dark': '$(brown-50)',
        active: {
            '@light': '$(brown-50)',
            '@dark': '$(brown-40)',
        },
        text: {
            '@light': '$(brown-90)',
            '@dark': '$(brown-95)',
        },
    },
    orange: {
        '@light': '$(orange-40)',
        '@dark': '$(orange-50)',
        active: {
            '@light': '$(orange-50)',
            '@dark': '$(orange-40)',
        },
        text: {
            '@light': '$(orange-90)',
            '@dark': '$(orange-95)',
        },
    },
    amber: {
        '@light': '$(amber-40)',
        '@dark': '$(amber-50)',
        active: {
            '@light': '$(amber-50)',
            '@dark': '$(amber-30)',
        },
        text: {
            '@light': '$(amber-90)',
            '@dark': '$(amber-95)',
        },
    },
    yellow: {
        '@light': '$(yellow-40)',
        '@dark': '$(yellow-50)',
        active: {
            '@light': '$(yellow-50)',
            '@dark': '$(yellow-30)',
        },
        text: {
            '@light': '$(yellow-90)',
            '@dark': '$(yellow-95)',
        },
    },
    lime: {
        '@light': '$(lime-40)',
        '@dark': '$(lime-50)',
        active: {
            '@light': '$(lime-50)',
            '@dark': '$(lime-30)',
        },
        text: {
            '@light': '$(lime-90)',
            '@dark': '$(lime-95)',
        },
    },
    green: {
        '@light': '$(green-40)',
        '@dark': '$(green-50)',
        active: {
            '@light': '$(green-50)',
            '@dark': '$(green-30)',
        },
        text: {
            '@light': '$(green-90)',
            '@dark': '$(green-95)',
        },
    },
    beryl: {
        '@light': '$(beryl-40)',
        '@dark': '$(beryl-50)',
        active: {
            '@light': '$(beryl-50)',
            '@dark': '$(beryl-30)',
        },
        text: {
            '@light': '$(beryl-90)',
            '@dark': '$(beryl-95)',
        },
    },
    teal: {
        '@light': '$(teal-40)',
        '@dark': '$(teal-50)',
        active: {
            '@light': '$(teal-50)',
            '@dark': '$(teal-30)',
        },
        text: {
            '@light': '$(teal-90)',
            '@dark': '$(teal-95)',
        },
    },
    cyan: {
        '@light': '$(cyan-40)',
        '@dark': '$(cyan-50)',
        active: {
            '@light': '$(cyan-50)',
            '@dark': '$(cyan-30)',
        },
        text: {
            '@light': '$(cyan-90)',
            '@dark': '$(cyan-95)',
        },
    },
    sky: {
        '@light': '$(sky-60)',
        '@dark': '$(sky-50)',
        active: {
            '@light': '$(sky-70)',
            '@dark': '$(sky-40)',
        },
        text: '$(white)',
    },
    blue: {
        '@light': '$(blue-60)',
        '@dark': '$(blue-50)',
        active: {
            '@light': '$(blue-70)',
            '@dark': '$(blue-40)',
        },
        text: '$(white)',
    },
    indigo: {
        '@light': '$(indigo-60)',
        '@dark': '$(indigo-50)',
        active: {
            '@light': '$(indigo-70)',
            '@dark': '$(indigo-40)',
        },
        text: '$(white)',
    },
    violet: {
        '@light': '$(violet-60)',
        '@dark': '$(violet-50)',
        active: {
            '@light': '$(violet-70)',
            '@dark': '$(violet-40)',
        },
        text: '$(white)',
    },
    purple: {
        '@light': '$(purple-60)',
        '@dark': '$(purple-50)',
        active: {
            '@light': '$(purple-70)',
            '@dark': '$(purple-40)',
        },
        text: '$(white)',
    },
    fuchsia: {
        '@light': '$(fuchsia-60)',
        '@dark': '$(fuchsia-50)',
        active: {
            '@light': '$(fuchsia-70)',
            '@dark': '$(fuchsia-40)',
        },
        text: '$(white)',
    },
    pink: {
        '@light': '$(pink-60)',
        '@dark': '$(pink-50)',
        active: {
            '@light': '$(pink-70)',
            '@dark': '$(pink-40)',
        },
        text: '$(white)',
    },
    crimson: {
        '@light': '$(crimson-60)',
        '@dark': '$(crimson-50)',
        active: {
            '@light': '$(crimson-70)',
            '@dark': '$(crimson-40)',
        },
        text: '$(white)',
    },
    red: {
        '@light': '$(red-60)',
        '@dark': '$(red-50)',
        active: {
            '@light': '$(red-70)',
            '@dark': '$(red-40)',
        },
        text: '$(white)',
    },
    text: {
        invert: {
            '@light': '$(white)',
            '@dark': '$(black)',
        },
        strong: {
            '@light': '$(slate-95)',
            '@dark': '$(gray-10)',
        },
        neutral: {
            '@light': '$(slate-70)',
            '@dark': '$(gray-30)',
        },
        lightest: {
            '@light': '$(slate-30)',
            '@dark': '$(gray-60)',
        },
        lighter: {
            '@light': '$(slate-40)',
            '@dark': '$(gray-50)',
        },
        light: {
            '@light': '$(slate-50)',
            '@dark': '$(gray-40)',
        },
        gray: {
            '@light': '$(gray-60)',
            '@dark': '$(gray-30)',
        },
        slate: {
            '@light': '$(slate-60)',
            '@dark': '$(slate-30)',
        },
        brown: {
            '@light': '$(brown-60)',
            '@dark': '$(brown-30)',
        },
        orange: {
            '@light': '$(orange-60)',
            '@dark': '$(orange-30)',
        },
        amber: {
            '@light': '$(amber-60)',
            '@dark': '$(amber-40)',
        },
        yellow: {
            '@light': '$(yellow-60)',
            '@dark': '$(yellow-40)',
        },
        lime: {
            '@light': '$(lime-70)',
            '@dark': '$(lime-40)',
        },
        green: {
            '@light': '$(green-70)',
            '@dark': '$(green-40)',
        },
        beryl: {
            '@light': '$(beryl-70)',
            '@dark': '$(beryl-40)',
        },
        teal: {
            '@light': '$(teal-70)',
            '@dark': '$(teal-40)',
        },
        cyan: {
            '@light': '$(cyan-70)',
            '@dark': '$(cyan-40)',
        },
        sky: {
            '@light': '$(sky-70)',
            '@dark': '$(sky-30)',
        },
        blue: {
            '@light': '$(blue-60)',
            '@dark': '$(blue-30)',
        },
        indigo: {
            '@light': '$(indigo-60)',
            '@dark': '$(indigo-30)',
        },
        violet: {
            '@light': '$(violet-60)',
            '@dark': '$(violet-30)',
        },
        purple: {
            '@light': '$(purple-60)',
            '@dark': '$(purple-30)',
        },
        fuchsia: {
            '@light': '$(fuchsia-60)',
            '@dark': '$(fuchsia-30)',
        },
        pink: {
            '@light': '$(pink-60)',
            '@dark': '$(pink-30)',
        },
        crimson: {
            '@light': '$(crimson-60)',
            '@dark': '$(crimson-30)',
        },
        red: {
            '@light': '$(red-60)',
            '@dark': '$(red-30)',
        },
    }
}

const variables = extend(colors, _variables) as (typeof colors & typeof _variables)

export default variables