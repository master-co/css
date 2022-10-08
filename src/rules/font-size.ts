import { dash, FONT, SIZE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class FontSize extends MasterCSSRule {
    static override matches = /^f(ont)?:([0-9]|(max|min|calc|clamp)\(.*\))((?!\|).)*$/;
    static override propName = dash(FONT, SIZE);
}