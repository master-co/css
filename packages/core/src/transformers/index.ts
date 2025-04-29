import autoFillSolid from './auto-fill-solid'

const transformers = {
    'auto-fill-solid': autoFillSolid,
}

export default transformers

export type TransformerNames = keyof typeof transformers