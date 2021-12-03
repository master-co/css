import { DASH, FONT, SIZE } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterFontSizeVirtualClass extends MasterVirtualClass {
    static override prefixes = /^(f-size:|f:[0-9])/;
    static override properties = [FONT + DASH + SIZE];
}