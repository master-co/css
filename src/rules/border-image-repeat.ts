import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'BorderImageRepeat'
    static override matches = /^border-image:(?:stretch|repeat|round|space)(?:(?!\|).)*$/
}