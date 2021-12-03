import { ANIMATION, DASH, NAME } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterAnimationNameVirtualClass extends MasterVirtualClass {
    static override prefixes = /^(animation-name|\*name):/;
    static override properties = [ANIMATION + DASH + NAME];
}