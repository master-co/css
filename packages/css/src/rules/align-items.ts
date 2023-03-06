import { Rule } from '../rule'

export class AlignItems extends Rule {
    static id = 'AlignItems' as const
    static matches = '^ai:.'
}