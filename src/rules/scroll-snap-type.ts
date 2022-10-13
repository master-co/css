import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'ScrollSnapType'
    static override matches = /^scroll-snap:(([xy]|block|inline|both)(\|(proximity|mandatory))?)(?!\|)/
    static override propName = 'scroll-snap-type'
}