import { ModeDefinitions } from '../types/config'

const modes = {
    'light': {
        'ground': '$grey-0',
        'base': '$white',
        'invert': '$black',
        'stone': {
            '': '$stone-30',
            'active': '$stone-40',
            'text': '$stone-90'
        },
        'frame': {
            'neutral': '$grey-60',
            'light': 'oklch(0% 0 none / 0.12)',
            'lighter': 'oklch(0% 0 none / 0.09)',
            'lightest': 'oklch(0% 0 none / 0.06)'
        },
        'gray': {
            '': '$gray-30',
            'active': '$gray-40',
            'text': '$gray-90'
        },
        'grey': {
            '': '$grey-30',
            'active': '$grey-40',
            'text': '$grey-90'
        },
        'slate': {
            '': '$slate-30',
            'active': '$slate-40',
            'text': '$slate-90'
        },
        'brown': {
            '': '$brown-40',
            'active': '$brown-50',
            'text': '$brown-90'
        },
        'orange': {
            '': '$orange-40',
            'active': '$orange-50',
            'text': '$orange-90'
        },
        'amber': {
            '': '$amber-40',
            'active': '$amber-50',
            'text': '$amber-90'
        },
        'yellow': {
            '': '$yellow-40',
            'active': '$yellow-50',
            'text': '$yellow-90'
        },
        'lime': {
            '': '$lime-40',
            'active': '$lime-50',
            'text': '$lime-90'
        },
        'green': {
            '': '$green-40',
            'active': '$green-50',
            'text': '$green-90'
        },
        'beryl': {
            '': '$beryl-40',
            'active': '$beryl-50',
            'text': '$beryl-90'
        },
        'teal': {
            '': '$teal-40',
            'active': '$teal-50',
            'text': '$teal-90'
        },
        'cyan': {
            '': '$cyan-40',
            'active': '$cyan-50',
            'text': '$cyan-90'
        },
        'sky': {
            '': '$sky-60',
            'active': '$sky-70',
            'text': '$white'
        },
        'blue': {
            '': '$blue-60',
            'active': '$blue-70',
            'text': '$white'
        },
        'indigo': {
            '': '$indigo-60',
            'active': '$indigo-70',
            'text': '$white'
        },
        'violet': {
            '': '$violet-60',
            'active': '$violet-70',
            'text': '$white'
        },
        'purple': {
            '': '$purple-60',
            'active': '$purple-70',
            'text': '$white'
        },
        'fuchsia': {
            '': '$fuchsia-60',
            'active': '$fuchsia-70',
            'text': '$white'
        },
        'pink': {
            '': '$pink-60',
            'active': '$pink-70',
            'text': '$white'
        },
        'crimson': {
            '': '$crimson-60',
            'active': '$crimson-70',
            'text': '$white'
        },
        'red': {
            '': '$red-60',
            'active': '$red-70',
            'text': '$white'
        },
        'text': {
            'invert': '$white',
            'strong': '$grey-100',
            'neutral': '$grey-70',
            'lightest': '$grey-30',
            'lighter': '$grey-40',
            'light': '$grey-50',
            'stone': '$stone-60',
            'gray': '$gray-60',
            'grey': '$grey-60',
            'slate': '$slate-60',
            'brown': '$brown-60',
            'orange': '$orange-60',
            'amber': '$amber-60',
            'yellow': '$yellow-70',
            'lime': '$lime-70',
            'green': '$green-70',
            'beryl': '$beryl-70',
            'teal': '$teal-70',
            'cyan': '$cyan-70',
            'sky': '$sky-70',
            'blue': '$blue-60',
            'indigo': '$indigo-60',
            'violet': '$violet-60',
            'purple': '$purple-60',
            'fuchsia': '$fuchsia-60',
            'pink': '$pink-60',
            'crimson': '$crimson-60',
            'red': '$red-60'
        }
    },
    'dark': {
        'ground': '$gray-100',
        'base': '$gray-95',
        'invert': '$white',
        'stone': {
            '': '$stone-40',
            'active': '$stone-30',
            'text': '$stone-95'
        },
        'frame': {
            'neutral': '$gray-30',
            'light': 'oklch(100% 0 none / 0.12)',
            'lighter': 'oklch(100% 0 none / 0.09)',
            'lightest': 'oklch(100% 0 none / 0.06)'
        },
        'gray': {
            '': '$gray-40',
            'active': '$gray-30',
            'text': '$gray-95'
        },
        'grey': {
            '': '$grey-40',
            'active': '$grey-30',
            'text': '$grey-95'
        },
        'slate': {
            '': '$slate-40',
            'active': '$slate-30',
            'text': '$slate-95'
        },
        'brown': {
            '': '$brown-50',
            'active': '$brown-40',
            'text': '$brown-95'
        },
        'orange': {
            '': '$orange-50',
            'active': '$orange-40',
            'text': '$orange-95'
        },
        'amber': {
            '': '$amber-50',
            'active': '$amber-30',
            'text': '$amber-95'
        },
        'yellow': {
            '': '$yellow-50',
            'active': '$yellow-30',
            'text': '$yellow-95'
        },
        'lime': {
            '': '$lime-50',
            'active': '$lime-30',
            'text': '$lime-95'
        },
        'green': {
            '': '$green-50',
            'active': '$green-30',
            'text': '$green-95'
        },
        'beryl': {
            '': '$beryl-50',
            'active': '$beryl-30',
            'text': '$beryl-95'
        },
        'teal': {
            '': '$teal-50',
            'active': '$teal-30',
            'text': '$teal-95'
        },
        'cyan': {
            '': '$cyan-50',
            'active': '$cyan-30',
            'text': '$cyan-95'
        },
        'sky': {
            '': '$sky-50',
            'active': '$sky-40',
            'text': '$white'
        },
        'blue': {
            '': '$blue-50',
            'active': '$blue-40',
            'text': '$white'
        },
        'indigo': {
            '': '$indigo-50',
            'active': '$indigo-40',
            'text': '$white'
        },
        'violet': {
            '': '$violet-50',
            'active': '$violet-40',
            'text': '$white'
        },
        'purple': {
            '': '$purple-50',
            'active': '$purple-40',
            'text': '$white'
        },
        'fuchsia': {
            '': '$fuchsia-50',
            'active': '$fuchsia-40',
            'text': '$white'
        },
        'pink': {
            '': '$pink-50',
            'active': '$pink-40',
            'text': '$white'
        },
        'crimson': {
            '': '$crimson-50',
            'active': '$crimson-40',
            'text': '$white'
        },
        'red': {
            '': '$red-50',
            'active': '$red-40',
            'text': '$white'
        },
        'text': {
            'invert': '$black',
            'strong': '$white',
            'neutral': '$gray-30',
            'lightest': '$gray-60',
            'lighter': '$gray-50',
            'light': '$gray-40',
            'stone': '$stone-30',
            'gray': '$gray-30',
            'grey': '$grey-30',
            'slate': '$slate-30',
            'brown': '$brown-30',
            'orange': '$orange-30',
            'amber': '$amber-40',
            'yellow': '$yellow-40',
            'lime': '$lime-40',
            'green': '$green-40',
            'beryl': '$beryl-40',
            'teal': '$teal-40',
            'cyan': '$cyan-40',
            'sky': '$sky-30',
            'blue': '$blue-30',
            'indigo': '$indigo-30',
            'violet': '$violet-30',
            'purple': '$purple-30',
            'fuchsia': '$fuchsia-30',
            'pink': '$pink-30',
            'crimson': '$crimson-30',
            'red': '$red-30'
        }
    }
} satisfies ModeDefinitions

export default modes