import { BACKDROP, DASH, FILTER } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterBackdropFilterVirtualClass extends MasterVirtualClass {
    static override prefixes = /^(bd|backdrop-filter):/;
    static override properties = [BACKDROP + DASH + FILTER];
}