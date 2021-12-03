import { MasterStyle } from '@master/style';
import { BACKGROUND, BLEND, DASH, MODE } from './constants/css-property-keyword';

export class MasterBackgroundBlendModeStyle extends MasterStyle {
    static override prefixes = /^bg-blend:/;
    static override properties = [BACKGROUND + DASH + BLEND + DASH + MODE];
}