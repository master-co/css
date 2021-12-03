import { MasterVirtualClass } from './virtual-class';
import { BACKGROUND, DASH, SIZE } from './constants/css-property-keyword';

export class MasterBackgroundSizeVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^(bg-size:|bg:(cover|contain))/;
    static override properties = [BACKGROUND + DASH + SIZE];
}