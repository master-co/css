import { Rule } from '../rule'

export class Width extends Rule {
    static override id = 'Width' as const
    static override matches = '^w:.'
}