import { dash, GRID, ROW, START } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class GridRowStart extends MasterCSSRule {
    static override propName = dash(GRID, ROW, START);
    static override unit = '';
}