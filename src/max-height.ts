import { MAX_HEIGHT } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterMaxHeightVirtualClass extends MasterVirtualClass {
    static override prefixes = /^max-h:/;
    static override properties = [MAX_HEIGHT];
}