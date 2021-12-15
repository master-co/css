import { DASH, HEIGHT, LINE } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class LineHeightStyle extends MasterStyle {
    static override prefixes =  /^lh:/;
    static override properties = [LINE + DASH + HEIGHT];
    static override defaultUnit = '';
}