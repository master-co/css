import { Rule } from '../rule'

export class AlignContent extends Rule {
    static id = 'AlignContent' as const
    static matches = '^ac:.'
}