import { Rule } from '../rule'

export default class extends Rule {
    static override id = 'TransitionProperty' as const
    static override matches = '^~property:.'
}