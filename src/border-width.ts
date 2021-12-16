import { MasterStyle } from '@master/style';
import { BORDER, DASH, WIDTH } from './constants/css-property-keyword';

export class BorderWidthStyle extends MasterStyle {
    static override prefixes = /^b(order)?-width:/;
    static override properties = [BORDER + DASH + WIDTH];
    static override supportFullName = false;
}