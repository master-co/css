import { dash, LAYOUT, TABLE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'TableLayout'
    static override propName = dash(TABLE, LAYOUT);
}