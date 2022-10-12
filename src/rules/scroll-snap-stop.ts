import { MasterCSSRule } from '../rule';
import { dash, SCROLL, SNAP, STOP } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'ScrollSnapStop'
    static override matches = /^scroll-snap:(normal|always)(?!\|)/
    static override propName = dash(SCROLL, SNAP, STOP);
}