import { DASH, FLEX, GROW } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class FlexGrowStyle extends MasterStyle {
    static override properties = [FLEX + DASH + GROW];
}