import { dash, PLACE, SELF } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'PlaceSelf'
    static override propName = dash(PLACE, SELF);
    override order = -1;
}