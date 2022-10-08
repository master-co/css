import { GRID } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class Grid extends MasterCSSRule {
    static override propName = GRID;
    override order = -1;
}