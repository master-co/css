import { LETTER_SPACING } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'LetterSpacing'
    static override matches =  /^ls:./;
    static override propName = LETTER_SPACING;
    static override unit = 'em';
}