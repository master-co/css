import { MasterCSSRule } from '../rule';
import { dash, SCROLL, SNAP, TYPE } from '../constants/css-property-keyword';

export class ScrollSnapType extends MasterCSSRule {
    static override matches = /^scroll-snap:(([xy]|block|inline|both)(\|(proximity|mandatory))?)(?!\|)/
    static override key = dash(SCROLL, SNAP, TYPE);
}