import { DASH, DECORATION, TEXT } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterTextDecorationVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^(t-decoration:|t:(underline|line-throught))/;
    static override properties = [TEXT + DASH + DECORATION];
}