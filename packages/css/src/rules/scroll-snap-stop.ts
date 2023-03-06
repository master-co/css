import { Rule } from '../rule'

export class ScrollSnapStop extends Rule {
    static id = 'ScrollSnapStop' as const
    static matches = '^scroll-snap:(?:normal|always|$values)(?!\\|)'
}