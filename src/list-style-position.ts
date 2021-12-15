import { DASH, LIST, POSITION, STYLE } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class ListStylePositionStyle extends MasterStyle {
    static override properties = [LIST + DASH + STYLE + DASH + POSITION];
}