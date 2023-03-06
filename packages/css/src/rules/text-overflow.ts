import { Rule } from '../rule'

export class TextOverflow extends Rule {
    static id = 'TextOverflow' as const
    static matches = '^(?:text-(?:overflow|ovf):.|t(?:ext)?:(?:ellipsis|clip|$values)(?!\\|))'
}