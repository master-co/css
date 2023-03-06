import { Rule } from '../rule'

export class OutlineStyle extends Rule {
    static id = 'OutlineStyle' as const
    static matches = '^outline:(?:none|dotted|dashed|solid|double|groove|ridge|inset|outset|$values)(?!\\|)'
}