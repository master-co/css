import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'TextAlign'
    static override matches = /^t(ext)?:(justify|center|left|right|start|end)(?!\|)/
    static override propName = 'text-align'
}