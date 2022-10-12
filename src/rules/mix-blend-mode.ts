import { MasterCSSRule } from '../rule';
import { BLEND, dash, MIX, MODE } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'MixBlendMode'
    static override matches = /^blend:./;
    static override propName = dash(MIX, BLEND, MODE);
}