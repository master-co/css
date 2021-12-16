import { ALIGN, DASH, VERTICAL } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class VerticalAlignStyle extends Style {
    static override prefixes =  /^v(ertical)?(-align)?:/;
    static override properties = [VERTICAL + DASH + ALIGN];
}