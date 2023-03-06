import { Rule } from '../rule'

export class WritingMode extends Rule {
    static id = 'WritingMode' as const
    static matches = '^writing:.'
}