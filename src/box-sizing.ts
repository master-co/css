import { BORDER, BOX, CONTENT, DASH, SIZING } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class BoxSizingStyle extends MasterStyle {
    static override prefixes = /^box:(content|border)/;
    static override properties = [BOX + DASH + SIZING];
    static override values = {
        [CONTENT]: CONTENT + DASH + BOX,
        [BORDER]: BORDER + DASH + BOX
    }
}