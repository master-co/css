import { Rule } from '../rule'

export class VerticalAlign extends Rule {
    static override id = 'VerticalAlign' as const
    static override matches = '^(?:v|vertical):.'
}