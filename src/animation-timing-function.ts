import { ANIMATION, DASH, PLAY_STATE, TIMING_FUNCTION } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterAnimationTimingFunctionVirtualClass extends MasterVirtualClass {
    static override prefixes = /^(animation-timing-function|\*easing):/;
    static override properties = [ANIMATION + DASH + TIMING_FUNCTION];
}