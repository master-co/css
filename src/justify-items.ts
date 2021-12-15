import { DASH, ITEMS, JUSTIFY } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class JustifyItemsStyle extends MasterStyle {
    static override prefixes = /^justify-items:/;
    static override properties = [JUSTIFY + DASH + ITEMS];

}