import { dash, ITEMS, PLACE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class PlaceItems extends MasterCSSRule {
    static override key = dash(PLACE, ITEMS);
    override order = -1;
}