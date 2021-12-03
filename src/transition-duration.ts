import { DASH, DURATION, TRANSITION } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterTransitionDurationVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^(transition-duration|~duration):/;
    static override properties = [TRANSITION + DASH + DURATION];
}