import { RuleConfig } from '../rule'

export const flexWrap: RuleConfig = {
    matches: '^flex:(?:wrap(?:-reverse)?|nowrap|$values)(?!\\|)'
}