import Rule from '../rule'

export default class extends Rule {
    static override id = 'BorderCollapse'
    static override matches = /^b(order)?:(collapse|separate)(?!\|)/
}