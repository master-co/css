import { Rule } from '../rule'

export class MixBlendMode extends Rule {
    static override id = 'MixBlendMode' as const
    static override matches = '^blend:.'
}