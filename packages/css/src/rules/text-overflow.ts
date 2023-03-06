import { RuleConfig } from '../rule'

export const textOverflow: RuleConfig = {
    matches: '^(?:text-(?:overflow|ovf):.|t(?:ext)?:(?:ellipsis|clip|$values)(?!\\|))'
}