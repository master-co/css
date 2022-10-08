import { dash, GRID, TEMPLATE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class GridTemplate extends MasterCSSRule {
    static override propName = dash(GRID, TEMPLATE);
    override order = -1;
}