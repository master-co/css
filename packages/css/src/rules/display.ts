import { Rule } from '../rule'

export class Display extends Rule {
    static override id = 'Display' as const
    static override matches = '^d:.'
}