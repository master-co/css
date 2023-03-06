import { RuleConfig } from '..'

export const borderImageSource: RuleConfig = {
    matches: '^border-image:(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)(?!\\|)'
}