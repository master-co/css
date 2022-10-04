import { COLUMNS, CONTENT, dash, GRID, MAX, MIN, TEMPLATE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class GridTemplateColumns extends MasterCSSRule {
    static override matches = /^grid-template-cols:./;
    static override key = dash(GRID, TEMPLATE, COLUMNS);
}