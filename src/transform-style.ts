import { DASH, STYLE, TRANSFORM } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterTransformStyleVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^(transform-style:|transform:(flat|preserve-3d))/;
    static override properties = [TRANSFORM + DASH + STYLE];
}