import { BEHAVIOR, dash, SCROLL } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class ScrollBehavior extends MasterCSSRule {
    static override propName = dash(SCROLL, BEHAVIOR);
}