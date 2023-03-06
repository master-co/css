import { Rule } from '../rule'

export class MinHeight extends Rule {
    static override id = 'MinHeight' as const
    static override matches = '^min-h:.'
}