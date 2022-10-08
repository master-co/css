import { AUTO, CONTENT, dash, GRID, MAX, MIN, ROWS } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class GridAutoRows extends MasterCSSRule {
    static override propName = dash(GRID, AUTO, ROWS);
}