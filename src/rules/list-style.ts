import { dash, LIST, STYLE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'ListStyle'
    static override propName = dash(LIST, STYLE);
    override order = -1;
}