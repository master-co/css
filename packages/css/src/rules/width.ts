import { Rule } from '../'

export class Width extends Rule {
    static override id = 'Width' as const
    static override matches = '^w:.'
}