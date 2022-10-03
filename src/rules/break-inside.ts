import { MasterCSSRule } from '../rule';
import { BREAK, dash, INSIDE } from '../constants/css-property-keyword';

export class BreakInside extends MasterCSSRule {
    static override key = dash(BREAK, INSIDE);
}