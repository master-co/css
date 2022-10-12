import { dash, ITEMS, PLACE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'PlaceItems'
    static override propName = dash(PLACE, ITEMS);
    override order = -1;
}