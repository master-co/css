import { MasterVirtualClass } from './virtual-class';
import { BORDER, DASH, STYLE } from './constants/css-property-keyword';

export class MasterBorderStyleVirtualClass extends MasterVirtualClass {
    static override prefixes = /^b-style:/;
    static override properties = [BORDER + DASH + STYLE];
}