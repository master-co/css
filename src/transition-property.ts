import { DASH, PROPERTY, TRANSITION } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterTransitionPropertyVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^(transition-property|~property):/;
    static override properties = [TRANSITION + DASH + PROPERTY];
}