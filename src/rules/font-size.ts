import { dash, FONT, SIZE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'FontSize'
    static override matches = /^f(ont)?:([0-9]|(max|min|calc|clamp)\(.*\))((?!\|).)*$/;
    static override propName = dash(FONT, SIZE);
}