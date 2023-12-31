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
    'foreground': {
        'accent': {
            '@light': '$(yellow-60)',
            '@dark': '$(amber-20)'
        },
        'strong': {
            '@light': '$(slate-95)',
            '@dark': '$(gray-10)'
        },
        'neutral': {
            '@light': '$(slate-70)',
            '@dark': '$(gray-30)'
        },
        'dim': {
            '@light': '$(slate-30)',
            '@dark': '$(gray-60)'
        },
        'fade': {
            '@light': '$(slate-60)',
            '@dark': '$(gray-40)'
        },
        'gray': {
            '@light': '$(gray-70)',
            '@dark': '$(gray-20)'
        },
        'slate': {
            '@light': '$(slate-70)',
            '@dark': '$(slate-20)'
        },
        'brown': {
            '@light': '$(brown-60)',
            '@dark': '$(brown-20)'
        },
        'orange': {
            '@light': '$(orange-70)',
            '@dark': '$(orange-30)'
        },
        'amber': {
            '@light': '$(amber-80)',
            '@dark': '$(amber-30)'
        },
        'yellow': {
            '@light': '$(yellow-80)',
            '@dark': '$(yellow-30)'
        },
        'lime': {
            '@light': '$(lime-80)',
            '@dark': '$(lime-30)'
        },
        'green': {
            '@light': '$(green-80)',
            '@dark': '$(green-30)'
        },
        'beryl': {
            '@light': '$(beryl-80)',
            '@dark': '$(beryl-30)'
        },
        'teal': {
            '@light': '$(teal-70)',
            '@dark': '$(teal-30)'
        },
        'cyan': {
            '@light': '$(cyan-70)',
            '@dark': '$(cyan-30)'
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
    'white': '#ffffff',
    'black': '#000000',
    'frame': {
        '@light': '$(slate-60)',
        '@dark': '$(gray-30)'
    },
    'neutral': {
        '@light': '$(white)',
        '@dark': '$(gray-95)'
    },
    'fade': {
        '@light': '$(slate-5)',
        '@dark': '$(gray-90)'
    },
    'accent': {
        'primary': {
            '@light': '$(yellow-50)',
            '@dark': '$(amber-20)'
        },
        'gray': {
            '@light': '$(gray-50)',
            '@dark': '$(gray-40)'
        },
        'slate': {
            '@light': '$(slate-50)',
            '@dark': '$(slate-40)'
        },
        'brown': {
            '@light': '$(brown-50)',
            '@dark': '$(brown-40)'
        },
        'orange': {
            '@light': '$(orange-50)',
            '@dark': '$(orange-40)'
        },
        'amber': {
            '@light': '$(amber-50)',
            '@dark': '$(amber-40)'
        },
        'yellow': {
            '@light': '$(yellow-50)',
            '@dark': '$(yellow-40)'
        },
        'lime': {
            '@light': '$(lime-50)',
            '@dark': '$(lime-40)'
        },
        'green': {
            '@light': '$(green-50)',
            '@dark': '$(green-40)'
        },
        'beryl': {
            '@light': '$(beryl-50)',
            '@dark': '$(beryl-40)'
        },
        'teal': {
            '@light': '$(teal-50)',
            '@dark': '$(teal-40)'
        },
        'cyan': {
            '@light': '$(cyan-50)',
            '@dark': '$(cyan-40)'
        },
        'sky': {
            '@light': '$(sky-50)',
            '@dark': '$(sky-40)'
        },
        'blue': {
            '@light': '$(blue-50)',
            '@dark': '$(blue-40)'
        },
        'indigo': {
            '@light': '$(indigo-50)',
            '@dark': '$(indigo-40)'
        },
        'violet': {
            '@light': '$(violet-50)',
            '@dark': '$(violet-40)'
        },
        'purple': {
            '@light': '$(purple-50)',
            '@dark': '$(purple-40)'
        },
        'fuchsia': {
            '@light': '$(fuchsia-50)',
            '@dark': '$(fuchsia-40)'
        },
        'pink': {
            '@light': '$(pink-50)',
            '@dark': '$(pink-40)'
        },
        'crimson': {
            '@light': '$(crimson-50)',
            '@dark': '$(crimson-40)'
        },
        'red': {
            '@light': '$(red-50)',
            '@dark': '$(red-40)'
        }
    },
    'gray': {
        '5': '#f6f5f7',
        '10': '#e8e7e9',
        '20': '#cdccce',
        '30': '#b5b4b6',
        '40': '#9c9b9d',
        '50': '#7c7b7d',
        '60': '#626163',
        '70': '#4b4a4c',
        '80': '#3e3d3f',
        '90': '#323133',
        '95': '#222123',
        '': {
            '@light': '$(gray-30)',
            '@dark': '$(gray-40)'
        }
    },
    'slate': {
        '5': '#f8f9fB',
        '10': '#e8eaf1',
        '20': '#c1c9db',
        '30': '#a7b1c9',
        '40': '#8e9bb8',
        '50': '#6c7fa1',
        '60': '#576988',
        '70': '#41506a',
        '80': '#324056',
        '90': '#263145',
        '95': '#17202f',
        '': {
            '@light': '$(slate-30)',
            '@dark': '$(slate-40)'
        }
    },
    'brown': {
        '5': '#fff6f0',
        '10': '#fdeade',
        '20': '#f5c4a7',
        '30': '#e39d7d',
        '40': '#d38259',
        '50': '#bf6a40',
        '60': '#a5522b',
        '70': '#94411e',
        '80': '#7c3113',
        '90': '#60220b',
        '95': '#3e1305',
        '': {
            '@light': '$(brown-40)',
            '@dark': '$(brown-50)'
        }
    },
    'orange': {
        '5': '#fff5ea',
        '10': '#ffebd6',
        '20': '#ffc793',
        '30': '#ffaa60',
        '40': '#ff8e33',
        '50': '#ff7a14',
        '60': '#ea5d00',
        '70': '#c64800',
        '80': '#9e3700',
        '90': '#702500',
        '95': '#421400',
        '': {
            '@light': '$(orange-40)',
            '@dark': '$(orange-50)'
        }
    },
    'amber': {
        '5': '#fff9eb',
        '10': '#fff1cc',
        '20': '#ffe093',
        '30': '#ffcf60',
        '40': '#ffc038',
        '50': '#ffaa00',
        '60': '#ef8b00',
        '70': '#d17300',
        '80': '#a85400',
        '90': '#753600',
        '95': '#422000',
        '': {
            '@light': '$(amber-40)',
            '@dark': '$(amber-50)'
        }
    },
    'yellow': {
        '5': '#fffae5',
        '10': '#fff3c6',
        '20': '#ffe684',
        '30': '#ffde5b',
        '40': '#ffd314',
        '50': '#f9bf00',
        '60': '#e5a400',
        '70': '#cc8400',
        '80': '#a36400',
        '90': '#704100',
        '95': '#422400',
        '': {
            '@light': '$(yellow-40)',
            '@dark': '$(yellow-50)'
        }
    },
    'lime': {
        '5': '#f5ffe5',
        '10': '#e9fdc9',
        '20': '#d0f98f',
        '30': '#b8f359',
        '40': '#a6eb37',
        '50': '#91d91a',
        '60': '#77c012',
        '70': '#61a60c',
        '80': '#498707',
        '90': '#296000',
        '95': '#183800',
        '': {
            '@light': '$(lime-40)',
            '@dark': '$(lime-50)'
        }
    },
    'green': {
        '5': '#e7fdea',
        '10': '#cbfbd3',
        '20': '#93f6aa',
        '30': '#56f07f',
        '40': '#31e366',
        '50': '#00d64e',
        '60': '#00c147',
        '70': '#00a83d',
        '80': '#008932',
        '90': '#006023',
        '95': '#003815',
        '': {
            '@light': '$(green-40)',
            '@dark': '$(green-50)'
        }
    },
    'beryl': {
        '5': '#e0fef2',
        '10': '#bcffe2',
        '20': '#7affc9',
        '30': '#53f7bb',
        '40': '#0fefa4',
        '50': '#00e09d',
        '60': '#00c68b',
        '70': '#00ad73',
        '80': '#008959',
        '90': '#00603e',
        '95': '#003824',
        '': {
            '@light': '$(beryl-40)',
            '@dark': '$(beryl-50)'
        }
    },
    'teal': {
        '5': '#dbfefd',
        '10': '#bdfefb',
        '20': '#84fff6',
        '30': '#4cfff3',
        '40': '#00f4e4',
        '50': '#00eada',
        '60': '#00d1cd',
        '70': '#00a7ad',
        '80': '#008793',
        '90': '#006375',
        '95': '#003742',
        '': {
            '@light': '$(teal-40)',
            '@dark': '$(teal-50)'
        }
    },
    'cyan': {
        '5': '#e0ffff',
        '10': '#bcfcff',
        '20': '#84f6ff',
        '30': '#5beeff',
        '40': '#1ee1ff',
        '50': '#00ccf9',
        '60': '#00b3ea',
        '70': '#0092cc',
        '80': '#0073ad',
        '90': '#005489',
        '95': '#003051',
        '': {
            '@light': '$(cyan-40)',
            '@dark': '$(cyan-50)'
        }
    },
    'sky': {
        '5': '#e5f5ff',
        '10': '#ccebff',
        '20': '#8ed3ff',
        '30': '#6bc6ff',
        '40': '#33b0ff',
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
        '10': '#d1e8ff',
        '20': '#93c4ff',
        '30': '#75aeff',
        '40': '#478dff',
        '50': '#2d70ff',
        '60': '#205df8',
        '70': '#164ee8',
        '80': '#1644ce',
        '90': '#14329f',
        '95': '#0e1e67',
        '': {
            '@light': '$(blue-60)',
            '@dark': '$(blue-50)'
        }
    },
    'indigo': {
        '5': '#f0f1fe',
        '10': '#e0e3ff',
        '20': '#b2bafe',
        '30': '#99a3ff',
        '40': '#7a7cff',
        '50': '#635bff',
        '60': '#5647f9',
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
        '10': '#e7e0ff',
        '20': '#c4b2ff',
        '30': '#b299ff',
        '40': '#956bff',
        '50': '#854cff',
        '60': '#7a28ff',
        '70': '#6d00ea',
        '80': '#5f00cc',
        '90': '#49009e',
        '95': '#31006b',
        '': {
            '@light': '$(violet-60)',
            '@dark': '$(violet-50)'
        }
    },
    'purple': {
        '5': '#f6f0ff',
        '10': '#eee0ff',
        '20': '#d5b2ff',
        '30': '#c593ff',
        '40': '#ad60ff',
        '50': '#a042ff',
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
        '10': '#f5e0ff',
        '20': '#e8b2fe',
        '30': '#dd89ff',
        '40': '#d35bff',
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
        '10': '#fce3f2',
        '20': '#faaed5',
        '30': '#f986c1',
        '40': '#f25daa',
        '50': '#ec3c97',
        '60': '#df1178',
        '70': '#cb0a67',
        '80': '#b20656',
        '90': '#89003d',
        '95': '#60002b',
        '': {
            '@light': '$(pink-60)',
            '@dark': '$(pink-50)'
        }
    },
    'crimson': {
        '5': '#ffeff3',
        '10': '#fee1e9',
        '20': '#fdb0c5',
        '30': '#fa89a8',
        '40': '#f65a84',
        '50': '#f03769',
        '60': '#d91a4d',
        '70': '#bf1845',
        '80': '#a3143b',
        '90': '#841030',
        '95': '#5f0c23',
        '': {
            '@light': '$(crimson-60)',
            '@dark': '$(crimson-50)'
        }
    },
    'red': {
        '5': '#ffefef',
        '10': '#ffe0e0',
        '20': '#ffb2b2',
        '30': '#ff8484',
        '40': '#ff5656',
        '50': '#f03737',
        '60': '#e30b0b',
        '70': '#c50606',
        '80': '#a80000',
        '90': '#890000',
        '95': '#600000',
        '': {
            '@light': '$(red-60)',
            '@dark': '$(red-50)'
        }
    }

}

export default variables