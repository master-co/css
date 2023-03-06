import { Rule } from '../rule'

export class FlexWrap extends Rule {
    static id = 'FlexWrap' as const
    static matches = '^flex:(?:wrap(?:-reverse)?|nowrap|$values)(?!\\|)'
}