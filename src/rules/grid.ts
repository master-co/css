import { GRID } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class Grid extends MasterCSSRule {
    static override key = GRID;
    override order = -1;
}