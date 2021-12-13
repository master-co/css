import { MasterStyle } from '@master/style';
import { BACKGROUND, DASH, SIZE } from './constants/css-property-keyword';

export class BackgroundSizeStyle extends MasterStyle {
    static override prefixes =  /^(bg-size:|bg:(cover|contain))/;
    static override properties = [BACKGROUND + DASH + SIZE];
}