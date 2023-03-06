import { Rule } from '../rule'

export class ListStylePosition extends Rule {
    static override id = 'ListStylePosition' as const
    static override matches = '^list-style:(?:inside|outside|$values)(?!\\|)'
}