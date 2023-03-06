import { Rule } from '../rule'

export class BorderImageRepeat extends Rule {
    static id = 'BorderImageRepeat' as const
    static matches = '^border-image:(?:stretch|repeat|round|space|$values)(?!\\|)'
}