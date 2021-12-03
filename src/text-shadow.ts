import { MasterVirtualClass } from './virtual-class';
import { DASH, SHADOW, TEXT } from './constants/css-property-keyword';

export class MasterTextShadowVirtualClass extends MasterVirtualClass {
    static override prefixes = /^t-shadow:/;
    static override properties = [TEXT + DASH + SHADOW];
}