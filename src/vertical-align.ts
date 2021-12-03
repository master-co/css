import { ALIGN, DASH, VERTICAL } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterVerticalAlignVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^(v|v-align):/;
    static override properties = [VERTICAL + DASH + ALIGN];
}