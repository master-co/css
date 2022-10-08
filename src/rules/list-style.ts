import { dash, LIST, STYLE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class ListStyle extends MasterCSSRule {
    static override propName = dash(LIST, STYLE);
    override order = -1;
}