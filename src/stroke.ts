import { STROKE } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterStrokeVirtualClass extends MasterVirtualClass {
    static override prefixes = /^stroke:/;
    static override properties = [STROKE];
}