import { Rule } from '../'

export class VerticalAlign extends Rule {
    static override id = 'VerticalAlign' as const
    static override matches = '^(?:v|vertical):.'
}