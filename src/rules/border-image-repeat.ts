import Rule from '../rule'

export default class extends Rule {
    static override id = 'BorderImageRepeat'
    static override matches = /^border-image:(?:stretch|repeat|round|space)(?:(?!\|).)*$/
}