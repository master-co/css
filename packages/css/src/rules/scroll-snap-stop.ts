import { Rule } from '../rule'

export default class extends Rule {
    static override id = 'ScrollSnapStop' as const
    static override matches = '^scroll-snap:(?:normal|always|$values)(?!\\|)'
}