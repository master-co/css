import Rule from '../rule'

export default class extends Rule {
    static override id: 'CounterReset' = 'CounterReset' as const
    static override unit = ''
}