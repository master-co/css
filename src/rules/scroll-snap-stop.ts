import { MasterCSSRule } from '../rule';
import { dash, SCROLL, SNAP, STOP } from '../constants/css-property-keyword';

export class ScrollSnapStop extends MasterCSSRule {
    static override matches = /^scroll-snap:(normal|always)(?!\|)/
    static override key = dash(SCROLL, SNAP, STOP);
}