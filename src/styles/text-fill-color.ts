import { CURRENT_COLOR } from '../constants/css-property-keyword';
import { Style } from '../style';

export class TextFillColor extends Style {
    static id = 'textFillColor';
    static override matches = /^text-fill-color:./;
    static override colorStarts = 'text-fill:';
    static override colorful = true;
    override get props(): { [key: string]: any } {
        return {
            '-webkit-text-fill-color': this
        };
    }
    static override values = {
        current: CURRENT_COLOR
    }
}