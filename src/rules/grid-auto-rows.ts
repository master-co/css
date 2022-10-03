import { AUTO, CONTENT, dash, GRID, MAX, MIN, ROWS } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class GridAutoRows extends MasterCSSRule {
    static override key = dash(GRID, AUTO, ROWS);
    static override values = {
        'min': dash(MIN, CONTENT),
        'max': dash(MAX, CONTENT)
    };
}