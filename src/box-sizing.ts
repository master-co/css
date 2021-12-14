import { BORDER, BOX, BOX_PREFIX, CONTENT, DASH, SIZING } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class BoxSizingStyle extends MasterStyle {
    static override prefixes = /^box-sizing:/;
    static override properties = [BOX + DASH + SIZING];
    static override semantics = {
        [BOX_PREFIX + CONTENT]: CONTENT + DASH + BOX,
        [BOX_PREFIX + BORDER]: BORDER + DASH + BOX
    }
}