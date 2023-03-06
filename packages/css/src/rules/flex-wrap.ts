import { Rule } from '../rule'

export class FlexWrap extends Rule {
    static override id = 'FlexWrap' as const
    static override matches = '^flex:(?:wrap(?:-reverse)?|nowrap|$values)(?!\\|)'
}