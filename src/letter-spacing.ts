import { LETTER_SPACING } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class LetterSpacingStyle extends Style {
    static override matches =  /^ls:./;
    static override key = LETTER_SPACING;
    static override unit = 'em';
}