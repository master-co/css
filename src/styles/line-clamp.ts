import { CLAMP, dash, LINE } from '../constants/css-property-keyword';
import { Style } from '@master/style';

export class LineClamp extends Style {
    static override key = dash(LINE, CLAMP);
    static override unit = '';
    override get props(): { [key: string]: any } {
        return {
            '-webkit-line-clamp': this
        }
    }
}