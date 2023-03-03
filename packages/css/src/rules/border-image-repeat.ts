import { Rule } from '../'

export default class extends Rule {
    static override id = 'BorderImageRepeat' as const
    static override matches = '^border-image:(?:stretch|repeat|round|space|$values)(?!\\|)'
}