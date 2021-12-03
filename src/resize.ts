import { MasterVirtualClass } from './virtual-class';
import { RESIZE } from './constants/css-property-keyword';

export class MasterResizeVirtualClass extends MasterVirtualClass {
    static override prefixes = /^resize:/;
    static override properties = [RESIZE];
}