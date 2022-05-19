import { Style } from '../style';
import { BOX, BREAK, dash, DECORATION } from '../constants/css-property-keyword';

export class BoxDecorationBreak extends Style {
    static override matches = /^box:(slice|clone)(?!\|)/;
    static override key = dash(BOX, DECORATION, BREAK);
    override get props(): { [key: string]: any } {
        return {
            'box-decoration-break': this,
            '-webkit-box-decoration-break': this
        }
    };
}