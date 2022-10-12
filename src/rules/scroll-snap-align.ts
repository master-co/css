import { MasterCSSRule } from '../rule';
import { ALIGN, dash, SCROLL, SNAP } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'ScrollSnapAlign'
    static override matches = /^scroll-snap:(start|end|center)/
    static override propName = dash(SCROLL, SNAP, ALIGN);
}