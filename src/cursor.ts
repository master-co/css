import { MasterVirtualClass } from './virtual-class';
import { CURSOR } from './constants/css-property-keyword';

export class MasterCursorVirtualClass extends MasterVirtualClass {
    static override prefixes = /^cursor:/;
    static override properties = [CURSOR];
}