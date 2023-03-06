import { Rule } from '../rule'

export class MixBlendMode extends Rule {
    static id = 'MixBlendMode' as const
    static matches = '^blend:.'
}