import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'BorderImageWidth'
    static override matches = /^border-image:(?:\.?[0-9]|(max|min|calc|clamp)\(.*\))(?:(?!\|).)*$/
    static override propName = 'border-image-width'
}