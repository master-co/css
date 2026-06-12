import coreMath from './core.math'
import coreVariable from './core.variable'

const functionTransformers = {
    'core.math': coreMath,
    'core.variable': coreVariable,
}

export default functionTransformers

export type FunctionTransformerNames = keyof typeof functionTransformers
