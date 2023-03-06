import { Rule } from '../rule'

export class BorderImageWidth extends Rule {
    static id = 'BorderImageWidth' as const
    static matches = '^border-image:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$'
}