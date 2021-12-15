import { DASH, SPACING, WORD } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class WordSpacingStyle extends MasterStyle {
    static override properties = [WORD + DASH + SPACING];
}