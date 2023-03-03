import { Rule } from '../'

export class Display extends Rule {
    static override id = 'Display' as const
    static override matches = '^d:.'
}