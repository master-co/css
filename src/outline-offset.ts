import { DASH, OFFSET, OUTLINE } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class OutlineOffsetStyle extends MasterStyle {
    static override properties = [OUTLINE + DASH + OFFSET];
    static override defaultUnit = 'px';
}