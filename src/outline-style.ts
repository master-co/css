import { DASH, OUTLINE, STYLE } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class OutlineStyleStyle extends MasterStyle {
    static override properties = [OUTLINE + DASH + STYLE];
}