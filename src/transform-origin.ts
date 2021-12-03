import { DASH, ORIGIN, TRANSFORM } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterTransformOriginVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^(transform-origin:|transform:(top|bottom|right|left|center))/;
    static override properties = [TRANSFORM + DASH + ORIGIN];
}