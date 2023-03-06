import { Rule } from '../rule'

export class Display extends Rule {
    static id = 'Display' as const
    static matches = '^d:.'
}