import { Rule } from '../'

export class WritingMode extends Rule {
    static override id = 'WritingMode' as const
    static override matches = '^writing:.'
}