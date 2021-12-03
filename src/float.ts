import { FLOAT } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class MasterFloatStyle extends MasterStyle {
    static override prefixes = /^float:/;
    static override properties = [FLOAT];
}