import { CLAMP, dash, LINE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'LineClamp'
    static override propName = dash(LINE, CLAMP);
    static override unit = '';
    override get(declaration): { [key: string]: any } {
        return {
            '-webkit-line-clamp': declaration
        }
    }
}