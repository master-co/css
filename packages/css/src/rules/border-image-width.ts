import { Rule } from '../rule'

export class BorderImageWidth extends Rule {
    static override id = 'BorderImageWidth' as const
    static override matches = '^border-image:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$'
}