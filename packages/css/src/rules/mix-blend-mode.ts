import { Rule } from '../rule'

export default class extends Rule {
    static override id = 'MixBlendMode' as const
    static override matches = '^blend:.'
}