import { MAX_WIDTH } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterMaxWidthVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^max-w:/;
    static override properties = [MAX_WIDTH];
}