import screenSizes from '../tokens/screen-sizes'

const queries = {
    ...screenSizes,
    landscape: 'media (orientation:landscape)',
    portrait: 'media (orientation:portrait)',
    motion: 'media (prefers-reduced-motion:no-preference)',
    'reduced-motion': 'media (prefers-reduced-motion:reduce)',
}

export default queries