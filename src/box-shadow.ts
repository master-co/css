import { MasterVirtualClass } from './virtual-class';
import { BOX, DASH, SHADOW } from './constants/css-property-keyword';

export class MasterBoxShadowVirtualClass extends MasterVirtualClass {
    static override prefixes = /^shadow:/;
    static override properties = [BOX + DASH + SHADOW];
}