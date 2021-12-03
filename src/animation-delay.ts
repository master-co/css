import { ANIMATION, DASH, DELAY } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterAnimationDelayVirtualClass extends MasterVirtualClass {
    static override prefixes = /^(animation-delay|\*delay):/;
    static override properties = [ANIMATION + DASH + DELAY];
}