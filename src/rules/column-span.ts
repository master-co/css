import { COLUMN, dash, SPAN } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class ColumnSpan extends MasterCSSRule {
    static override matches = /^col-span:./;
    static override key = dash(COLUMN, SPAN);
}