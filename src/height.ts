import { HEIGHT } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterHeightVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^h:/;
    static override properties = [HEIGHT];
    static override semantics = {
        'h:full': '100%'
    }
}