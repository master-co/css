import { MasterCSSRule } from '../rule';
import { BACKGROUND, dash, REPEAT } from '../constants/css-property-keyword';

export class BackgroundRepeat extends MasterCSSRule {
    static override matches = /^(bg|background):(space|round|repeat|no-repeat|repeat-x|repeat-y)(?![;a-zA-Z])/;
    static override propName = dash(BACKGROUND, REPEAT);
}