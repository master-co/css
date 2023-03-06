import { Rule } from '../rule'

export class MaxHeight extends Rule {
    static override id = 'MaxHeight' as const
    static override matches = '^max-h:.'
}