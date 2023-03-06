import { Rule } from '../rule'

export class ListStyleType extends Rule {
    static id = 'ListStyleType' as const
    static matches = '^list-style:(?:disc|decimal|$values)(?!\\|)'
}