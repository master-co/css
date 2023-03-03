import { Rule } from '../rule'

export default class extends Rule {
    static override id = 'AspectRatio' as const
    static override matches = '^aspect:.'
    static override unit = ''
}