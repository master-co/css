import { OVERFLOW } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class OverflowStyle extends MasterStyle {
    static override prefixes = /^(overflow|ovf)(-x|-y)?:/;
    static override properties = [OVERFLOW];
}