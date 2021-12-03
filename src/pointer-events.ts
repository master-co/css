import { MasterVirtualClass } from './virtual-class';
import { DASH, EVENTS, POINTERS } from './constants/css-property-keyword';

export class MasterPointerEventsVirtualClass extends MasterVirtualClass {
    static override prefixes = /^pointer-events:/;
    static override properties = [POINTERS + DASH + EVENTS];
}