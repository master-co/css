import { MasterCSSRule } from '../rule';
import { AFTER, BREAK, dash } from '../constants/css-property-keyword';

export class BreakAfter extends MasterCSSRule {
    static override propName = dash(BREAK, AFTER);
}