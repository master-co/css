import { Rule } from '../'

export class BorderCollapse extends Rule {
    static override id = 'BorderCollapse' as const
    static override matches = '^b(?:order)?:(?:collapse|separate|$values)(?!\\|)'
}