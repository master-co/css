import { Rule } from '../rule'

export class AspectRatio extends Rule {
    static id = 'AspectRatio' as const
    static matches = '^aspect:.'
    static unit = ''
}