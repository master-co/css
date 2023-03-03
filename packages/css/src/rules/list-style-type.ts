import { Rule } from '../'

export class ListStyleType extends Rule {
    static override id = 'ListStyleType' as const
    static override matches = '^list-style:(?:disc|decimal|$values)(?!\\|)'
}