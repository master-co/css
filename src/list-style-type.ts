import { DASH, LIST, STYLE, TYPE } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class ListStyleTypeStyle extends MasterStyle {
    static override properties = [LIST + DASH + STYLE + DASH + TYPE];
}