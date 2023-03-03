import { Rule } from '../rule'

export default class extends Rule {
    static override id = 'TextOverflow' as const
    static override matches = '^(?:text-(?:overflow|ovf):.|t(?:ext)?:(?:ellipsis|clip|$values)(?!\\|))'
}