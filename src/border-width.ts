import { Style } from '@master/style';
import { BORDER, DASH, WIDTH } from './constants/css-property-keyword';

export class BorderWidthStyle extends Style {
    static override prefixes = /^b(order)?-width:/;
    static override property = BORDER + DASH + WIDTH;
    static override supportFullName = false;
}