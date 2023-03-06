import { Rule } from '../rule'

export class BorderImageSource extends Rule {
    static id = 'BorderImageSource' as const
    static matches = '^border-image:(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)(?!\\|)'
}