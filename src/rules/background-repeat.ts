import { MasterCSSRule } from '../rule';
import { BACKGROUND, dash, REPEAT } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'BackgroundRepeat'
    static override matches = /^(bg|background):(space|round|repeat|no-repeat|repeat-x|repeat-y)(?![;a-zA-Z])/;
    static override propName = dash(BACKGROUND, REPEAT);
}