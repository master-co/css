import { OVERFLOW } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterOverflowVirtualClass extends MasterVirtualClass {
    static override prefixes = /^(overflow|ovf)(-x|-y)?:/;
    static override properties = [OVERFLOW];
}