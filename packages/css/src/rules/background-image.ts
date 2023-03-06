import { Rule } from '../rule'

export class BackgroundImage extends Rule {
    static override id = 'BackgroundImage' as const
    static override matches = '^(?:bg|background):(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)(?!\\|)'
    static override colorful = true
}