import type { AtRuleAliasDefinitions } from '../types/config'

const atRuleAliases = {
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
    start: 'starting-style',
    w: 'width',
    h: 'height',
} satisfies AtRuleAliasDefinitions

export default atRuleAliases
