import { LETTER_SPACING } from '../constants/css-property-keyword';
import { Style } from '../style';

export class LetterSpacing extends Style {
    static override matches =  /^ls:./;
    static override key = LETTER_SPACING;
    static override unit = 'em';
}