import screenSizes from '../tokens/screen-sizes'

const queries = {
    landscape: 'media (orientation:landscape)',
    portrait: 'media (orientation:portrait)',
    motion: 'media (prefers-reduced-motion:no-preference)',
    'reduced-motion': 'media (prefers-reduced-motion:reduce)',
    ...screenSizes,
}

export default queries