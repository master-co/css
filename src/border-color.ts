import { MasterVirtualClass } from './virtual-class';
import { BORDER, COLOR, DASH } from './constants/css-property-keyword';

export class MasterBorderColorVirtualClass extends MasterVirtualClass {
    static override prefixes = /^b-color:/;
    static override properties = [BORDER + DASH + COLOR];
}