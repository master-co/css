import { Rule } from '../'

export class ScrollSnapAlign extends Rule {
    static override id = 'ScrollSnapAlign' as const
    static override matches = '^scroll-snap:(?:start|end|center|$values)'
}