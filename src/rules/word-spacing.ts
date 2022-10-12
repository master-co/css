import { dash, SPACING, WORD } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'WordSpacing'
    static override propName = dash(WORD, SPACING);
    static override unit = 'em';
}