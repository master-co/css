import { Rule } from '../'

export default class extends Rule {
    static override id = 'BoxSizing' as const
    static override matches = '^box:(?:$values)(?!\\|)'
}