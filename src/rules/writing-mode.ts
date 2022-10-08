import { dash, MODE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class WritingMode extends MasterCSSRule {
    static override matches = /^writing:./;
    static override propName = dash('writing', MODE);
}