import { COLUMN, dash, GRID, START } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class GridColumnStart extends MasterCSSRule {
    static override matches = /^grid-col-start:./;
    static override key = dash(GRID, COLUMN, START);
    static override unit = '';
}