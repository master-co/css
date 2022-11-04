import MasterCSSRule from '../rule'

export default class extends MasterCSSRule {
    static override id = 'OutlineStyle'
    static override matches = /^outline:(none|dotted|dashed|solid|double|groove|ridge|inset|outset)(?!\|)/
}