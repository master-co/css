import { MasterCSSRule } from '../rule';
import { BLEND, dash, MIX, MODE } from '../constants/css-property-keyword';

export class MixBlendMode extends MasterCSSRule {
    static override matches = /^blend:./;
    static override propName = dash(MIX, BLEND, MODE);
}