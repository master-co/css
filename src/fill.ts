import { FILL } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterFillVirtualClass extends MasterVirtualClass {
    static override prefixes = /^fill:/;
    static override properties = [FILL];
}