import { Rule } from '../rule'

export class AlignContent extends Rule {
    static override id = 'AlignContent' as const
    static override matches = '^ac:.'
}