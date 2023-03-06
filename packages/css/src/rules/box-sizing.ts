import { Rule } from '../rule'

export class BoxSizing extends Rule {
    static override id = 'BoxSizing' as const
    static override matches = '^box:(?:$values)(?!\\|)'
}