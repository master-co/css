import { Rule } from '../rule'

export default class extends Rule {
    static override id = 'BorderCollapse' as const
    static override matches = '^b(?:order)?:(?:collapse|separate|$values)(?!\\|)'
}