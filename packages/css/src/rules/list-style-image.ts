import { Rule } from '../rule'

export class ListStyleImage extends Rule {
    static override id = 'ListStyleImage' as const
    static override matches = '^list-style:(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)(?!\\|)'
}