import { Rule } from '../rule'

export class BorderImageSource extends Rule {
    static override id = 'BorderImageSource' as const
    static override matches = '^border-image:(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)(?!\\|)'
}