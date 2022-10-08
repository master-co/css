import { MasterCSSRule } from '../rule';
import { BEFORE, BREAK, dash } from '../constants/css-property-keyword';

export class BreakBefore extends MasterCSSRule {
    static override propName = dash(BREAK, BEFORE);
}