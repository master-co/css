import { LETTER_SPACING } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class LetterSpacing extends MasterCSSRule {
    static override matches =  /^ls:./;
    static override propName = LETTER_SPACING;
    static override unit = 'em';
}