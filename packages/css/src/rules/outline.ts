import { Rule } from '../rule'

export default class extends Rule {
    static override id = 'Outline' as const
    override order = -1
    static override colorful = true
}