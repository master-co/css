import { Rule } from '../'

export default class extends Rule {
    static override id = 'AlignSelf' as const
    static override matches = '^as:'
}