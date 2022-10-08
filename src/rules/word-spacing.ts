import { dash, SPACING, WORD } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class WordSpacing extends MasterCSSRule {
    static override propName = dash(WORD, SPACING);
    static override unit = 'em';
}