import { Rule } from '../'

export default class extends Rule {
    static override id = 'FlexWrap' as const
    static override matches = '^flex:(?:wrap(?:-reverse)?|nowrap|$values)(?!\\|)'
}