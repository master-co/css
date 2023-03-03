import { Rule } from '../'

export default class extends Rule {
    static override id = 'WritingMode' as const
    static override matches = '^writing:.'
}