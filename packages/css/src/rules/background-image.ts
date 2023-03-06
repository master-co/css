import { Rule } from '../rule'

export class BackgroundImage extends Rule {
    static id = 'BackgroundImage' as const
    static matches = '^(?:bg|background):(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)(?!\\|)'
    static colorful = true
}