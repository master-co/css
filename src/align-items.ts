import { ALIGN, DASH, ITEMS } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class AlignItemsStyle extends MasterStyle {
    static override properties = [ALIGN + DASH + ITEMS];
}