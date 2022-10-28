import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'TextDecorationThickness'
    static override matches = /^text-decoration:(from-font(?!\|)|([0-9]|(max|min|calc|clamp)\(.*\))((?!\|).)*$)/
    static override propName = 'text-decoration-thickness'
    static override unit = 'em'
}