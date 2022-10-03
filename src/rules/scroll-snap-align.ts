import { MasterCSSRule } from '../rule';
import { ALIGN, dash, SCROLL, SNAP } from '../constants/css-property-keyword';

export class ScrollSnapAlign extends MasterCSSRule {
    static override matches = /^scroll-snap:(start|end|center)/
    static override key = dash(SCROLL, SNAP, ALIGN);
}