import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'BorderCollapse'
    static override matches = /^b(order)?:(collapse|separate)(?!\|)/
    static override propName = 'border-collapse'
}