import { AREA, dash, GRID } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'GridArea'
    static override propName = dash(GRID, AREA);
    static override unit = '';
    override order = -1;
}