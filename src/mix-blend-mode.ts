import { Style } from '@master/style';
import { BLEND, dash, MIX, MODE } from './constants/css-property-keyword';

export class MixBlendMode extends Style {
    static override matches = /^blend:./;
    static override key = dash(MIX, BLEND, MODE);
}