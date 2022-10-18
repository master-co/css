import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'ShapeMargin'
    static override matches = /^shape:([0-9]|(max|min|calc|clamp)\(.*\))((?!\|).)*$/
    static override propName = 'shape-margin'
}