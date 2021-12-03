import { MasterVirtualClass } from './virtual-class';
import { BORDER } from './constants/css-property-keyword';

export class MasterBorderVirtualClass extends MasterVirtualClass {
    static override prefixes = /^b:/;
    static override properties = [BORDER];
}