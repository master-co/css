import { Rule } from '../rule'

export class BorderCollapse extends Rule {
    static id = 'BorderCollapse' as const
    static matches = '^b(?:order)?:(?:collapse|separate|$values)(?!\\|)'
}