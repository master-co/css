import { Style } from '@master/style';
import { BOX, BREAK, DASH, DECORATION } from './constants/css-property-keyword';

export class BoxDecorationBreakStyle extends Style {
    static override matches = /^box:(slice|clone)$/;
    static override key = BOX + DASH + DECORATION + DASH + BREAK;
}