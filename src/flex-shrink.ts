import { DASH, FLEX, SHRINK } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class FlexShrinkStyle extends MasterStyle {
    static override properties = [FLEX + DASH + SHRINK];
}