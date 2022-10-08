import { COLUMN, dash, END, GRID } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class GridColumnEnd extends MasterCSSRule {
    static override matches = /^grid-col-end:./;
    static override propName = dash(GRID, COLUMN, END);
    static override unit = '';
}