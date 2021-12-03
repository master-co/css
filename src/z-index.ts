import { Z_INDEX } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterZIndexVirtualClass extends MasterVirtualClass {
    static override prefixes = /^(z-index|z):/;
    static override properties = [Z_INDEX];
    static override defaultUnit = '';
}