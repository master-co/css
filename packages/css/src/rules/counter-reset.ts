import { Rule } from '../rule'

export class CounterReset extends Rule {
    static override id = 'CounterReset' as const
    static override unit = ''
}