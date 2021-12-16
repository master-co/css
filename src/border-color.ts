import { Style } from '@master/style';
import { BORDER, COLOR, DASH } from './constants/css-property-keyword';

export class BorderColorStyle extends Style {
    static override prefixes = /^b(order)?-color:/;
    static override properties = [BORDER + DASH + COLOR];
    static override supportFullName = false;
}