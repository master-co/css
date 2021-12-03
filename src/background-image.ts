import { MasterVirtualClass } from './virtual-class';
import { BACKGROUND, DASH, IMAGE } from './constants/css-property-keyword';

export class MasterBackgroundImageVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^bg-image:/;
    static override properties = [BACKGROUND + DASH + IMAGE];
}