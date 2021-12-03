import { MasterStyle } from '@master/style';
import { BORDER, DASH, WIDTH } from './constants/css-property-keyword';

export class MasterBorderWidthStyle extends MasterStyle {
    static override prefixes = /^b-width:/;
    static override properties = [BORDER + DASH + WIDTH];
}