import { LETTER_SPACING } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class LetterSpacingStyle extends Style {
    static override prefixes =  /^ls:/;
    static override properties = [LETTER_SPACING];
    static override defaultUnit = 'em';
}