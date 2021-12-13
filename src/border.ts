import { MasterStyle } from '@master/style';
import { BORDER } from './constants/css-property-keyword';

export class BorderStyle extends MasterStyle {
    static override prefixes = /^b:/;
    static override properties = [BORDER];
}