import { MasterStyle } from '@master/style';
import { BOX, BOX_PREFIX, BREAK, CLONE, DASH, DECORATION, SLICE } from './constants/css-property-keyword';

export class BoxDecorationBreakStyle extends MasterStyle {
    static override prefixes = /^box-decoration-break:/;
    static override properties = [BOX + DASH + DECORATION + DASH + BREAK];
    static override semantics = {
        [BOX_PREFIX + SLICE]: SLICE,
        [BOX_PREFIX + CLONE]: CLONE
    }
}