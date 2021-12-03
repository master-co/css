import { MasterVirtualClass } from './virtual-class';
import { BACKGROUND, COLOR, DASH } from './constants/css-property-keyword';

export class MasterBackgroundColorVirtualClass extends MasterVirtualClass {
    static override prefixes = /^(bg-color:|bg:transparent)/;
    static override properties = [BACKGROUND + DASH + COLOR];
}