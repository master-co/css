import { GRID } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'Grid'
    static override propName = GRID;
    override order = -1;
}