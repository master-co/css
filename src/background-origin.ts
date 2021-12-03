import { MasterVirtualClass } from './virtual-class';
import { BACKGROUND, DASH, ORIGIN } from './constants/css-property-keyword';

export class MasterBackgroundOriginVirtualClass extends MasterVirtualClass {
    static override prefixes = /^bg-origin:/;
    static override properties = [BACKGROUND + DASH + ORIGIN];
}