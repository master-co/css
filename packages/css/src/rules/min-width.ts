import { Rule } from '../'

export default class extends Rule {
    static override id = 'MinWidth' as const
    static override matches = '^min-w:.'
}