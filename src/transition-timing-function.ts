import { DASH, TIMING_FUNCTION, TRANSITION } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterTransitionTimingFunctionVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^(transition-timing-function|~easing):/;
    static override properties = [TRANSITION + DASH + TIMING_FUNCTION];
}