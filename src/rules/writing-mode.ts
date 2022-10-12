import { dash, MODE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'WritingMode'
    static override matches = /^writing:./;
    static override propName = dash('writing', MODE);
}