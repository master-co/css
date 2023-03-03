import { Rule } from '../'

export class AlignItems extends Rule {
    static override id = 'AlignItems' as const
    static override matches = '^ai:.'
}