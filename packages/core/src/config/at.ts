import type { AtDefinitions } from '../types/config'

const at = {
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
    start: 'starting-style'
} satisfies AtDefinitions

export default at