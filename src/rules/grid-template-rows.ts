import { CONTENT, dash, GRID, MAX, MIN, ROWS, TEMPLATE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class GridTemplateRows extends MasterCSSRule {
    static override key = dash(GRID, TEMPLATE, ROWS);
    static override values = {
        'min': dash(MIN, CONTENT),
        'max': dash(MAX, CONTENT)
    };
}