import { DASH, FONT, STYLE } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterFontStyleVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^(f-style:|f:italic)/;
    static override properties = [FONT + DASH + STYLE];
}