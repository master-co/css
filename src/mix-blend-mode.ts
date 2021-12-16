import { Style } from '@master/style';
import { BLEND, DASH, MIX, MODE } from './constants/css-property-keyword';

export class MixBlendModeStyle extends Style {
    static override prefixes = /^blend:/;
    static override properties = [MIX + DASH + BLEND + DASH + MODE];
}