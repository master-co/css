import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'BorderImageSource'
    static override matches = /^border-image:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\(.*\)(?:(?!\|).)*$/
}