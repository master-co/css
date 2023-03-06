import { Rule } from '../rule'

export class ScrollSnapAlign extends Rule {
    static id = 'ScrollSnapAlign' as const
    static matches = '^scroll-snap:(?:start|end|center|$values)'
}