import { COLUMNS, CONTENT, dash, GRID, MAX, MIN, TEMPLATE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'GridTemplateColumns'
    static override matches = /^grid-template-cols:./;
    static override propName = dash(GRID, TEMPLATE, COLUMNS);
}