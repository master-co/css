import { LETTER_SPACING } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class LetterSpacingStyle extends MasterStyle {
    static override prefixes =  /^ls:/;
    static override properties = [LETTER_SPACING];
    static override defaultUnit = 'em';
}