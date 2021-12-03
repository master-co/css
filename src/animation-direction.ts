import { ANIMATION, DASH, DIRECTION } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterAnimationDirectionVirtualClass extends MasterVirtualClass {
    static override prefixes = /^(animation-direction|\*direction):/;
    static override properties = [ANIMATION + DASH + DIRECTION];
}