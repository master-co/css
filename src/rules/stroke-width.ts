import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'StrokeWidth'
    static override matches = /^stroke:([0-9]|(max|min|calc|clamp)\(.*\))((?!\|).)*$/
    static override propName = 'stroke-width'
}