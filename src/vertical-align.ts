import { ALIGN, DASH, VERTICAL } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class VerticalAlignStyle extends MasterStyle {
    static override prefixes =  /^v(ertical)?(-align)?:/;
    static override properties = [VERTICAL + DASH + ALIGN];
}