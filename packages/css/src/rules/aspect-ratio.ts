import { Rule } from '../rule'

export class AspectRatio extends Rule {
    static override id = 'AspectRatio' as const
    static override matches = '^aspect:.'
    static override unit = ''
}