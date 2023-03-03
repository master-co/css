import { Rule } from '../'

export default class extends Rule {
    static override id = 'Width' as const
    static override matches = '^w:.'
}