import { MasterCSSRule } from '../rule';
import { AFTER, BREAK, dash } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'BreakAfter'
    static override propName = dash(BREAK, AFTER);
}