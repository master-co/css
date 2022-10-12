import { MasterCSSRule } from '../rule';
import { BACKGROUND, BLEND, dash, MODE } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'BackgroundBlendMode'
    static override propName = dash(BACKGROUND , BLEND , MODE);
}