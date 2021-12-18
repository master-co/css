import { Style } from '@master/style';
import { BACKGROUND, BLEND, DASH, MODE } from './constants/css-property-keyword';

export class BackgroundBlendModeStyle extends Style {
    static override prefixes = /^bg-blend:/;
    static override key = BACKGROUND + DASH + BLEND + DASH + MODE;
}