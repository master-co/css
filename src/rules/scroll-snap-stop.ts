import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'ScrollSnapStop'
    static override matches = /^scroll-snap:(normal|always)(?!\|)/
    static override propName = 'scroll-snap-stop'
}