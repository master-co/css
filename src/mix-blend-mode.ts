import { MasterStyle } from '@master/style';
import { BLEND, DASH, MIX, MODE } from './constants/css-property-keyword';

export class MasterMixBlendModeStyle extends MasterStyle {
    static override prefixes = /^blend:/;
    static override properties = [MIX + DASH + BLEND + DASH + MODE];
}