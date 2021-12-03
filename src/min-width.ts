import { MIN_WIDTH } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterMinWidthVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^min-w:/;
    static override properties = [MIN_WIDTH];
}