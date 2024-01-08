import screenSizes from '../tokens/screen-sizes'

const variables = {
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
    screen: screenSizes,
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
        view: 'view-box',
        black: '#000000'
    },
    current: 'currentColor',
    'text': {
        'strong': {
            '@light': '$(slate-95)',
            '@dark': '$(gray-10)'
        },
        'neutral': {
            '@light': '$(slate-70)',
            '@dark': '$(gray-30)'
        },
        'lightest': {
            '@light': '$(slate-30)',
            '@dark': '$(gray-60)'
        },
        'lighter': {
            '@light': '$(slate-40)',
            '@dark': '$(gray-50)'
        },
        'light': {
            '@light': '$(slate-50)',
            '@dark': '$(gray-40)'
        },
        'gray': {
            '@light': '$(gray-60)',
            '@dark': '$(gray-30)'
        },
        'slate': {
            '@light': '$(slate-60)',
            '@dark': '$(slate-30)'
        },
        'brown': {
            '@light': '$(brown-60)',
            '@dark': '$(brown-30)'
        },
        'orange': {
            '@light': '$(orange-60)',
            '@dark': '$(orange-30)'
        },
        'amber': {
            '@light': '$(amber-60)',
            '@dark': '$(amber-40)'
        },
        'yellow': {
            '@light': '$(yellow-60)',
            '@dark': '$(yellow-40)'
        },
        'lime': {
            '@light': '$(lime-60)',
            '@dark': '$(lime-40)'
        },
        'green': {
            '@light': '$(green-60)',
            '@dark': '$(green-40)'
        },
        'beryl': {
            '@light': '$(beryl-60)',
            '@dark': '$(beryl-40)'
        },
        'teal': {
            '@light': '$(teal-60)',
            '@dark': '$(teal-40)'
        },
        'cyan': {
            '@light': '$(cyan-60)',
            '@dark': '$(cyan-40)'
        },
        'sky': {
            '@light': '$(sky-60)',
            '@dark': '$(sky-30)'
        },
        'blue': {
            '@light': '$(blue-60)',
            '@dark': '$(blue-30)'
        },
        'indigo': {
            '@light': '$(indigo-60)',
            '@dark': '$(indigo-30)'
        },
        'violet': {
            '@light': '$(violet-60)',
            '@dark': '$(violet-30)'
        },
        'purple': {
            '@light': '$(purple-60)',
            '@dark': '$(purple-30)'
        },
        'fuchsia': {
            '@light': '$(fuchsia-60)',
            '@dark': '$(fuchsia-30)'
        },
        'pink': {
            '@light': '$(pink-60)',
            '@dark': '$(pink-30)'
        },
        'crimson': {
            '@light': '$(crimson-60)',
            '@dark': '$(crimson-30)'
        },
        'red': {
            '@light': '$(red-60)',
            '@dark': '$(red-30)'
        }
    },
    'base': {
        '@light': '$(white)',
        '@dark': '$(gray-95)'
    },
    'canvas': {
        '@light': '$(slate-5)',
        '@dark': '$(gray-90)'
    },
    'surface': {
        '@light': '$(white)',
        '@dark': '$(gray-80)'
    },
    'white': '#ffffff',
    'black': '#000000',
    'frame': {
        '@light': '$(slate-60)',
        '@dark': '$(gray-30)'
    },
    'gray': {
        '5': '#f6f5f7',
        '10': '#efeef0',
        '20': '#cdccce',
        '30': '#a2a1a3',
        '40': '#89888A',
        '50': '#737274',
        '60': '#585759',
        '70': '#444345',
        '80': '#323133',
        '90': '#29282a',
        '95': '#222123',
        '': {
            '@light': '$(gray-30)',
            '@dark': '$(gray-40)'
        }
    },
    'slate': {
        '5': '#f8f9fb',
        '10': '#eff2f9',
        '20': '#c8d0e3',
        '30': '#9fabc6',
        '40': '#7c8cab',
        '50': '#5f7395',
        '60': '#455572',
        '70': '#37455d',
        '80': '#283348',
        '90': '#1d273a',
        '95': '#182030',
        '': {
            '@light': '$(slate-30)',
            '@dark': '$(slate-40)'
        }
    },
    'brown': {
        '5': '#fff6f0',
        '10': '#feefe3',
        '20': '#f3bea4',
        '30': '#e7976e',
        '40': '#da7c4d',
        '50': '#cc6633',
        '60': '#b65325',
        '70': '#9d4119',
        '80': '#833111',
        '90': '#692007',
        '95': '#431304',
        '': {
            '@light': '$(brown-40)',
            '@dark': '$(brown-50)'
        }
    },
    'orange': {
        '5': '#fff5ea',
        '10': '#fff5df',
        '20': '#ffcb9e',
        '30': '#ff9b47',
        '40': '#ff8528',
        '50': '#ff6c0a',
        '60': '#e05200',
        '70': '#bc3e00',
        '80': '#992d00',
        '90': '#701d00',
        '95': '#471100',
        '': {
            '@light': '$(orange-40)',
            '@dark': '$(orange-50)'
        }
    },
    'amber': {
        '5': '#fff9eb',
        '10': '#fff4db',
        '20': '#ffe099',
        '30': '#ffc133',
        '40': '#ffb10a',
        '50': '#f99e00',
        '60': '#e57e00',
        '70': '#c15d00',
        '80': '#a34900',
        '90': '#753200',
        '95': '#4c1f00',
        '': {
            '@light': '$(amber-40)',
            '@dark': '$(amber-50)'
        }
    },
    'yellow': {
        '5': '#fffae5',
        '10': '#fffed1',
        '20': '#ffe993',
        '30': '#ffd233',
        '40': '#ffc300',
        '50': '#efaf00',
        '60': '#d69200',
        '70': '#b77400',
        '80': '#9e5c00',
        '90': '#753c00',
        '95': '#4c2600',
        '': {
            '@light': '$(yellow-40)',
            '@dark': '$(yellow-50)'
        }
    },
    'lime': {
        '5': '#f5ffe5',
        '10': '#f5ffd6',
        '20': '#d1fb8d',
        '30': '#acec46',
        '40': '#91d91a',
        '50': '#77c012',
        '60': '#61a60c',
        '70': '#4c8d07',
        '80': '#367604',
        '90': '#256000',
        '95': '#1b3d00',
        '': {
            '@light': '$(lime-40)',
            '@dark': '$(lime-50)'
        }
    },
    'green': {
        '5': '#e7fdea',
        '10': '#dbfee4',
        '20': '#a5f7b8',
        '30': '#35ed66',
        '40': '#00d655',
        '50': '#00c147',
        '60': '#00ad3f',
        '70': '#008e34',
        '80': '#007a2c',
        '90': '#006023',
        '95': '#003d16',
        '': {
            '@light': '$(green-40)',
            '@dark': '$(green-50)'
        }
    },
    'beryl': {
        '5': '#e0fef2',
        '10': '#d2fff7',
        '20': '#6cffd4',
        '30': '#0fefa4',
        '40': '#04e09e',
        '50': '#04cb8f',
        '60': '#00b277',
        '70': '#009360',
        '80': '#007f50',
        '90': '#00663e',
        '95': '#003d24',
        '': {
            '@light': '$(beryl-40)',
            '@dark': '$(beryl-50)'
        }
    },
    'teal': {
        '5': '#dbfefd',
        '10': '#cfffff',
        '20': '#7ffff6',
        '30': '#00f4e4',
        '40': '#00e4d4',
        '50': '#00ccc8',
        '60': '#00aeb7',
        '70': '#0092a3',
        '80': '#00798e',
        '90': '#005d75',
        '95': '#003747',
        '': {
            '@light': '$(teal-40)',
            '@dark': '$(teal-50)'
        }
    },
    'cyan': {
        '5': '#e0ffff',
        '10': '#d1ffff',
        '20': '#7ff6ff',
        '30': '#1ee1ff',
        '40': '#00ccf9',
        '50': '#00b3ea',
        '60': '#0099d6',
        '70': '#007dbc',
        '80': '#0067a8',
        '90': '#005089',
        '95': '#003156',
        '': {
            '@light': '$(cyan-40)',
            '@dark': '$(cyan-50)'
        }
    },
    'sky': {
        '5': '#e5f5ff',
        '10': '#d9f8ff',
        '20': '#a3deff',
        '30': '#6bc6ff',
        '40': '#34b2fd',
        '50': '#059fff',
        '60': '#008df9',
        '70': '#0073e0',
        '80': '#005cc6',
        '90': '#0041a3',
        '95': '#002566',
        '': {
            '@light': '$(sky-60)',
            '@dark': '$(sky-50)'
        }
    },
    'blue': {
        '5': '#e5f3fe',
        '10': '#dbf2fe',
        '20': '#add7ff',
        '30': '#70b0ff',
        '40': '#4c93fd',
        '50': '#3a7cff',
        '60': '#2563fd',
        '70': '#1b53ec',
        '80': '#1947d1',
        '90': '#1735a2',
        '95': '#102069',
        '': {
            '@light': '$(blue-60)',
            '@dark': '$(blue-50)'
        }
    },
    'indigo': {
        '5': '#f0f1fe',
        '10': '#e9ecfe',
        '20': '#c8cdfe',
        '30': '#939eff',
        '40': '#7e81fe',
        '50': '#7068ff',
        '60': '#5b4cfd',
        '70': '#4e39ed',
        '80': '#4732d2',
        '90': '#3623a3',
        '95': '#26176c',
        '': {
            '@light': '$(indigo-60)',
            '@dark': '$(indigo-50)'
        }
    },
    'violet': {
        '5': '#f2efff',
        '10': '#efe8ff',
        '20': '#d7c5ff',
        '30': '#b198fe',
        '40': '#9a70ff',
        '50': '#8e56fe',
        '60': '#812fff',
        '70': '#7407f2',
        '80': '#6405d1',
        '90': '#4f05a3',
        '95': '#35036e',
        '': {
            '@light': '$(violet-60)',
            '@dark': '$(violet-50)'
        }
    },
    'purple': {
        '5': '#f6f0ff',
        '10': '#f6e8fe',
        '20': '#e2bffe',
        '30': '#c492fd',
        '40': '#b266ff',
        '50': '#a849fe',
        '60': '#9514ff',
        '70': '#8200e5',
        '80': '#7100c1',
        '90': '#58008e',
        '95': '#3e0060',
        '': {
            '@light': '$(purple-60)',
            '@dark': '$(purple-50)'
        }
    },
    'fuchsia': {
        '5': '#faf0ff',
        '10': '#fde8fe',
        '20': '#f0baff',
        '30': '#dd89fe',
        '40': '#d760fe',
        '50': '#cf33ff',
        '60': '#b700e5',
        '70': '#a200c6',
        '80': '#8700a3',
        '90': '#660175',
        '95': '#480051',
        '': {
            '@light': '$(fuchsia-60)',
            '@dark': '$(fuchsia-50)'
        }
    },
    'pink': {
        '5': '#fef1f9',
        '10': '#fee9f8',
        '20': '#ffb8df',
        '30': '#f986c1',
        '40': '#fa65b2',
        '50': '#f747a2',
        '60': '#ef2188',
        '70': '#d61673',
        '80': '#b80c5c',
        '90': '#8f0543',
        '95': '#64032f',
        '': {
            '@light': '$(pink-60)',
            '@dark': '$(pink-50)'
        }
    },
    'crimson': {
        '5': '#ffeff2',
        '10': '#ffe8ec',
        '20': '#ffbac7',
        '30': '#ff849d',
        '40': '#ff6684',
        '50': '#fc4065',
        '60': '#ed2a51',
        '70': '#d7173e',
        '80': '#bb1536',
        '90': '#8f132c',
        '95': '#620e1f',
        '': {
            '@light': '$(crimson-60)',
            '@dark': '$(crimson-50)'
        }
    },
    'red': {
        '5': '#ffefef',
        '10': '#fee8e8',
        '20': '#ffbcbc',
        '30': '#ff8787',
        '40': '#fd5f5f',
        '50': '#f73f3f',
        '60': '#e52e2e',
        '70': '#d01b1b',
        '80': '#b81919',
        '90': '#921515',
        '95': '#650f0f',
        '': {
            '@light': '$(red-60)',
            '@dark': '$(red-50)'
        }
    }

}

export default variables