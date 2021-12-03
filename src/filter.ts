import { FILTER } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterFilterVirtualClass extends MasterVirtualClass {
    static override prefixes = /^filter:/;
    static override properties = [FILTER];
}