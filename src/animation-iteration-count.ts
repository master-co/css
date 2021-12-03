import { ANIMATION, COUNT, DASH, ITERATION } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterAnimationIterationCountVirtualClass extends MasterVirtualClass {
    static override prefixes = /^(animation-iteration-count|\*iteration-count):/;
    static override properties = [ANIMATION + DASH + ITERATION + DASH + COUNT];
}