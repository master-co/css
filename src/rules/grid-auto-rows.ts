import { AUTO, CONTENT, dash, GRID, MAX, MIN, ROWS } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'GridAutoRows'
    static override propName = dash(GRID, AUTO, ROWS);
}