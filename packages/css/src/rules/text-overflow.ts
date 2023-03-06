import { RuleConfig } from '..'

export const textOverflow: RuleConfig = {
    matches: '^(?:text-(?:overflow|ovf):.|t(?:ext)?:(?:ellipsis|clip|$values)(?!\\|))'
}