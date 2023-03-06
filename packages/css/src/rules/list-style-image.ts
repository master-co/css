import { RuleConfig } from '../rule'

export const listStyleImage: RuleConfig = {
    matches: '^list-style:(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)(?!\\|)'
}