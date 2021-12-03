import { DASH, FIT, OBJECT } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterObjectFitVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^(object-fit:|object:(contain|cover|fill|scale-down))/;
    static override properties = [OBJECT + DASH + FIT];
}