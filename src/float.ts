import { FLOAT } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class FloatStyle extends MasterStyle {
    static override prefixes = /^float:/;
    static override properties = [FLOAT];
}