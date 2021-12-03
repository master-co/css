import { ALIGN, DASH, TEXT } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterTextAlignVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^(t-align:|t:(top|center|left|right))/;
    static override properties = [TEXT + DASH + ALIGN];
}