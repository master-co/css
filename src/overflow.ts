import { OVERFLOW } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class MasterOverflowStyle extends MasterStyle {
    static override prefixes = /^(overflow|ovf)(-x|-y)?:/;
    static override properties = [OVERFLOW];
}