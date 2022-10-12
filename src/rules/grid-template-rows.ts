import { CONTENT, dash, GRID, MAX, MIN, ROWS, TEMPLATE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'GridTemplateRows'
    static override propName = dash(GRID, TEMPLATE, ROWS);
}