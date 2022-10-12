import { MasterCSSRule } from '../rule';
import { dash, SCROLL, SNAP, TYPE } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'ScrollSnapType'
    static override matches = /^scroll-snap:(([xy]|block|inline|both)(\|(proximity|mandatory))?)(?!\|)/
    static override propName = dash(SCROLL, SNAP, TYPE);
}