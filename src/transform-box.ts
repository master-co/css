import { BOX, DASH, TRANSFORM } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterTransformBoxVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^(transform-box:|transform:(content-box|border-box|fill-box|stroke-box|view-box))/;
    static override properties = [TRANSFORM + DASH + BOX];
}