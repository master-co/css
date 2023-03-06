import { Rule } from '../rule'

export class ScrollSnapStop extends Rule {
    static override id = 'ScrollSnapStop' as const
    static override matches = '^scroll-snap:(?:normal|always|$values)(?!\\|)'
}