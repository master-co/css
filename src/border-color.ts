import { Style } from '@master/style';
import { BORDER, COLOR, DASH } from './constants/css-property-keyword';

export class BorderColorStyle extends Style {
    static override prefixes = /^b-color:/;
    static override property = BORDER + DASH + COLOR;
}