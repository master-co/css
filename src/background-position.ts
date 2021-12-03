import { MasterVirtualClass } from './virtual-class';
import { BACKGROUND, DASH, POSITION } from './constants/css-property-keyword';

export class MasterBackgroundPositionVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^(bg-position:|bg:(top|bottom|right|left|center))/;
    static override properties = [BACKGROUND + DASH + POSITION];
}