import { Style } from '@master/style';
import { BLEND, DASH, MIX, MODE } from './constants/css-property-keyword';

export class MixBlendMode extends Style {
    static override matches = /^blend:./;
    static override key = MIX + DASH + BLEND + DASH + MODE;
}