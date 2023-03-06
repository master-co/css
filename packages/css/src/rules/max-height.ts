import { Rule } from '../rule'

export class MaxHeight extends Rule {
    static id = 'MaxHeight' as const
    static matches = '^max-h:.'
}