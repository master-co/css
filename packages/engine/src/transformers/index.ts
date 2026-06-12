import autoFillSolid from './auto-fill-solid'
import animationToken from './animation-token'

const transformers = {
    'auto-fill-solid': autoFillSolid,
    'animation-token': animationToken,
}

export default transformers

export type TransformerNames = keyof typeof transformers
