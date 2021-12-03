import { DASH, HEIGHT, LINE } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class MasterLineHeightStyle extends MasterStyle {
    static override prefixes =  /^(lh|line-height):/;
    static override properties = [LINE + DASH + HEIGHT];
    static override defaultUnit = '';
}