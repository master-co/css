import Rule from '../rule'

export default class extends Rule {
    static override id: 'BorderImageWidth' = 'BorderImageWidth' as const
    static override matches = /^border-image:(?:\.?[0-9]|(max|min|calc|clamp)\(.*\))(?:(?!\|).)*$/
}