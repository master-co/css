import { AUTO, COLUMNS, CONTENT, dash, GRID, MAX, MIN } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'GridAutoColumns'
    static override matches = /^grid-auto-cols:./;
    static override propName = dash(GRID, AUTO, COLUMNS);
}