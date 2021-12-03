import { ANIMATION } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterAnimationVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^animation:/;
    static override symbol = '*'; 
    static override properties = [ANIMATION];
}