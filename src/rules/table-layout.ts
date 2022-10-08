import { dash, LAYOUT, TABLE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class TableLayout extends MasterCSSRule {
    static override propName = dash(TABLE, LAYOUT);
}