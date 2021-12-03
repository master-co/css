import { WIDTH } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterWidthVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^w:/;
    static override properties = [WIDTH];
    static override semantics = {
        'w:full': '100%'
    }
}