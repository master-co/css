import { MasterCSSRule } from '../rule';
import { BREAK, dash, INSIDE } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'BreakInside'
    static override propName = dash(BREAK, INSIDE);
}