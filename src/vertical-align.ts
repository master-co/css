import { ALIGN, DASH, VERTICAL } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class VerticalAlignStyle extends MasterStyle {
    static override prefixes =  /^(v|v-align):/;
    static override properties = [VERTICAL + DASH + ALIGN];
}