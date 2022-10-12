import { dash, GRID, TEMPLATE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'GridTemplate'
    static override propName = dash(GRID, TEMPLATE);
    override order = -1;
}