import { Rule } from '../'

export default class extends Rule {
    static override id = 'FlexDirection' as const
    static override matches = '^flex:(?:(?:row|column)(?:-reverse)?|$values)(?!\\|)'
}