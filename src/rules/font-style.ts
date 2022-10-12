import { dash, FONT, STYLE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'FontStyle'
    static override matches = /^f(ont)?:(normal|italic|oblique)(?!\|)/;
    static override propName = dash(FONT, STYLE);
    static override unit = 'deg';
}