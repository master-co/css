import { BASIS, DASH, FLEX, FULL, PERCENT100 } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class FlexBasisStyle extends MasterStyle {
    static override properties = [FLEX + DASH + BASIS];
    static override values = { [FULL]: PERCENT100 };
}