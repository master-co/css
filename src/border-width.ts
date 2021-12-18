import { Style } from '@master/style';
import { BORDER, DASH, WIDTH } from './constants/css-property-keyword';

export class BorderWidthStyle extends Style {
    static override prefixes = /^b-width:|b(order)?:[0-9]((?!;).)*$/;
    static override property = BORDER + DASH + WIDTH;
}