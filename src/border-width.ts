import { MasterVirtualClass } from './virtual-class';
import { BORDER, DASH, WIDTH } from './constants/css-property-keyword';

export class MasterBorderWidthVirtualClass extends MasterVirtualClass {
    static override prefixes = /^b-width:/;
    static override properties = [BORDER + DASH + WIDTH];
}