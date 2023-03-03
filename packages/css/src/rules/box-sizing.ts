import { Rule } from '../rule'

export default class extends Rule {
    static override id = 'BoxSizing' as const
    static override matches = '^box:(?:$values)(?!\\|)'
}