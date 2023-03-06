import { Rule } from '../rule'

export class FlexDirection extends Rule {
    static id = 'FlexDirection' as const
    static matches = '^flex:(?:(?:row|column)(?:-reverse)?|$values)(?!\\|)'
}