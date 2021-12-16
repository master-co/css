import { MasterStyle } from '@master/style';
import { BACKGROUND, BLEND, DASH, MODE } from './constants/css-property-keyword';

export class BackgroundBlendModeStyle extends MasterStyle {
    static override prefixes = /^(bg|background)-blend(-mode)?:/;
    static override properties = [BACKGROUND + DASH + BLEND + DASH + MODE];
    static override supportFullName = false;
}