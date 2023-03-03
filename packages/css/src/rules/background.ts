import { Rule } from '../rule'

export default class extends Rule {
    static override id = 'Background' as const
    static override matches = '^bg:.'
    static override colorful = true
    override order = -1
}