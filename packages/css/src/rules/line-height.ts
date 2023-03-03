import { Rule } from '../rule'

export default class extends Rule {
    static override id = 'LineHeight' as const
    static override matches = '^lh:.'
    static override unit = ''
}