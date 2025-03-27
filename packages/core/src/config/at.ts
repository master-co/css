import type { AtDefinitions } from '../types/config'

const at = {
    all: { type: 'media', value: 'all' },
    print: { type: 'media', value: 'print' },
    screen: { type: 'media', value: 'screen' },
    speech: { type: 'media', value: 'speech' },
    landscape: { type: 'media', name: 'orientation', value: 'landscape' },
    portrait: { type: 'media', name: 'orientation', value: 'portrait' },
    motion: { type: 'media', name: 'prefers-reduced-motion', value: 'no-preference' },
    'motion-reduced': { type: 'media', name: 'prefers-reduced-motion', value: 'reduce' },
    base: { type: 'layer', value: 'base' },
    preset: { type: 'layer', value: 'preset' },
} satisfies AtDefinitions

export default at