import { DASH, LAYOUT, TABLE } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class TableLayoutStyle extends MasterStyle {
    static override properties = [TABLE + DASH + LAYOUT];
}