import { Rule } from '../rule'

export class CounterIncrement extends Rule {
    static override id = 'CounterIncrement' as const
    static override unit = ''
}