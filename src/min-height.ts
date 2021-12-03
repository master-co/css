import { MIN_HEIGHT } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterMinHeightVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^min-h:/;
    static override properties = [MIN_HEIGHT];
}