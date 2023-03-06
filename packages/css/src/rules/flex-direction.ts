import { RuleConfig } from '../rule'

export const flexDirection: RuleConfig = {
    matches: '^flex:(?:(?:row|column)(?:-reverse)?|$values)(?!\\|)'
}