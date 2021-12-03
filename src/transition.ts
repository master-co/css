import { TRANSITION } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterTransitionVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^transition:/;
    static override symbol = '~'; 
    static override properties = [TRANSITION];
}