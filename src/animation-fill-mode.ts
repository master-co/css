import { ANIMATION, DASH, FILL, MODE } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterAnimationFillModeVirtualClass extends MasterVirtualClass {
    static override prefixes = /^(animation-fill-mode|\*fill-mode):/;
    static override properties = [ANIMATION + DASH + FILL + DASH + MODE];
}