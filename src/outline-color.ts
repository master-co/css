import { COLOR, DASH, OUTLINE } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class OutlineColorStyle extends MasterStyle {
    static override properties = [OUTLINE + DASH + COLOR];
}