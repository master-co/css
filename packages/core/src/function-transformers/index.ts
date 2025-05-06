import coreCalc from './core.calc'
import coreVariable from './core.variable'

const functionTransformers = {
    'core.calc': coreCalc,
    'core.variable': coreVariable,
}

export default functionTransformers

export type FunctionTransformerNames = keyof typeof functionTransformers