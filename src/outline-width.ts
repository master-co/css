import { DASH, OUTLINE, WIDTH } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class OutlineWidthStyle extends MasterStyle {
    static override properties = [OUTLINE + DASH + WIDTH];
    static override defaultUnit = 'px';
}