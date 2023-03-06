import { Rule } from '../rule'

export class Width extends Rule {
    static id = 'Width' as const
    static matches = '^w:.'
}