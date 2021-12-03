import { DASH, STROKE, WIDTH } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterStrokeWidthVirtualClass extends MasterVirtualClass {
    static override prefixes = /^stroke-width:/;
    static override properties = [STROKE + DASH + WIDTH];
}