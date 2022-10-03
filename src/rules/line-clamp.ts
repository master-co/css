import { CLAMP, dash, LINE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class LineClamp extends MasterCSSRule {
    static override key = dash(LINE, CLAMP);
    static override unit = '';
    override get props(): { [key: string]: any } {
        return {
            '-webkit-line-clamp': this
        }
    }
}