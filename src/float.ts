import { FLOAT } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterFloatVirtualClass extends MasterVirtualClass {
    static override prefixes = /^float:/;
    static override properties = [FLOAT];
}