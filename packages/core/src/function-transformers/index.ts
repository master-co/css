import coreCalc from './core.calc'
import coreMathFn from './core.math-fn'
import coreVariable from './core.variable'

const functionTransformers = {
    'core.calc': coreCalc,
    'core.math-fn': coreMathFn,
    'core.variable': coreVariable,
}

export default functionTransformers

export type FunctionTransformerNames = keyof typeof functionTransformers