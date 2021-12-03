import { LETTER_SPACING } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class MasterLetterSpacingStyle extends MasterStyle {
    static override prefixes =  /^(ls|letter-spacing):/;
    static override properties = [LETTER_SPACING];
    static override defaultUnit = 'em';
}