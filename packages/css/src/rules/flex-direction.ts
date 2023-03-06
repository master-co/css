import { Rule } from '../rule'

export class FlexDirection extends Rule {
    static override id = 'FlexDirection' as const
    static override matches = '^flex:(?:(?:row|column)(?:-reverse)?|$values)(?!\\|)'
}