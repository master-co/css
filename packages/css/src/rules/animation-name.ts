import { Rule } from '../'

export default class extends Rule {
    static override id = 'AnimationName' as const
    static override matches = '^@name:.'
}