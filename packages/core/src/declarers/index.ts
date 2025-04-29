import coreGroup from './core.group'
import coreVariable from './core.variable'
import pair from './pair'

const declarers = {
    pair,
    'core.group': coreGroup,
    'core.variable': coreVariable
}

export default declarers

export type DeclarerNames = keyof typeof declarers