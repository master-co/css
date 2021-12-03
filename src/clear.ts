import { CLEAR } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterClearVirtualClass extends MasterVirtualClass {
    static override prefixes = /^clear:/;
    static override properties = [CLEAR];
}