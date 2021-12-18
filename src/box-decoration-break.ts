import { Style } from '@master/style';
import { BOX, BREAK, DASH, DECORATION } from './constants/css-property-keyword';

export class BoxDecorationBreakStyle extends Style {
    static override prefixes = /^box:(slice|clone)/;
    static override property = BOX + DASH + DECORATION + DASH + BREAK;
}