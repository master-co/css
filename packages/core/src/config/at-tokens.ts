import type { AtTokenDefinitions } from 'shared/css-config'

const atTokens = {
    all: 'media(all)',
    print: 'media(print)',
    screen: 'media(screen)',
    speech: 'media(speech)',
    landscape: 'media(orientation:landscape)',
    portrait: 'media(orientation:portrait)',
    motion: 'media(prefers-reduced-motion:no-preference)',
    'reduce-motion': 'media(prefers-reduced-motion:reduce)',
    base: 'layer(base)',
    preset: 'layer(preset)',
    main: 'layer(main)',
    general: 'layer(general)',
    start: 'starting-style',
    w: 'width',
    h: 'height',
} satisfies AtTokenDefinitions

export default atTokens
