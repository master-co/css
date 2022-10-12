import { COLUMN, dash, SPAN } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'ColumnSpan'
    static override matches = /^col-span:./;
    static override propName = dash(COLUMN, SPAN);
}