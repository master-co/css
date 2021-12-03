import { MasterVirtualClass } from './virtual-class';
import { BACKGROUND } from './constants/css-property-keyword';

export class MasterBackgroundVirtualClass extends MasterVirtualClass {
    static override prefixes = /^bg:/;
    static override properties = [BACKGROUND];
}