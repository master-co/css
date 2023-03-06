import { Rule } from '../rule'

export class BoxSizing extends Rule {
    static id = 'BoxSizing' as const
    static matches = '^box:(?:$values)(?!\\|)'
}