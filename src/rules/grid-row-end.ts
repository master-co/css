import { dash, END, GRID, ROW } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class GridRowEnd extends MasterCSSRule {
    static override propName = dash(GRID, ROW, END);
    static override unit = '';
}