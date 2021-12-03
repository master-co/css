import { DASH, OBJECT, POSITION } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterObjectPositionVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^(object-position:|object:(top|bottom|right|left|center))/;
    static override properties = [OBJECT + DASH + POSITION];
}