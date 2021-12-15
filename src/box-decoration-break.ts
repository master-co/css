import { MasterStyle } from '@master/style';
import { BOX, BREAK, DASH, DECORATION } from './constants/css-property-keyword';

export class BoxDecorationBreakStyle extends MasterStyle {
    static override prefixes = /^box:(slice|clone)/;
    static override properties = [BOX + DASH + DECORATION + DASH + BREAK];
}