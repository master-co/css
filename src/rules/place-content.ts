import { CONTENT, dash, PLACE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'PlaceContent'
    static override propName = dash(PLACE, CONTENT);
    override order = -1;
}