import { BEHAVIOR, dash, SCROLL } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'ScrollBehavior'
    static override propName = dash(SCROLL, BEHAVIOR);
}