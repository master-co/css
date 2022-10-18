import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'ScrollSnapAlign'
    static override matches = /^scroll-snap:(start|end|center)/
    static override propName = 'scroll-snap-align'
}