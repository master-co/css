import { MasterStyle } from '@master/style';
import { BORDER, DASH, STYLE } from './constants/css-property-keyword';

export class MasterBorderStyleStyle extends MasterStyle {
    static override prefixes = /^b-style:/;
    static override properties = [BORDER + DASH + STYLE];
}