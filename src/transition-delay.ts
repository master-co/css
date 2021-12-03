import { DASH, DELAY, TRANSITION } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterTransitionDelayVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^(transition-delay|~delay):/;
    static override properties = [TRANSITION + DASH + DELAY];
}