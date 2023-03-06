import { Rule } from '../rule'

export class ListStylePosition extends Rule {
    static id = 'ListStylePosition' as const
    static matches = '^list-style:(?:inside|outside|$values)(?!\\|)'
}