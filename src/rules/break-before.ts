import { MasterCSSRule } from '../rule';
import { BEFORE, BREAK, dash } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'BreakBefore'
    static override propName = dash(BREAK, BEFORE);
}