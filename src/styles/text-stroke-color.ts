import { CURRENT_COLOR } from '../constants/css-property-keyword';
import { Style } from '../style';

export class TextStrokeColor extends Style {
    static id = 'textStrokeColor';
    static override matches = /^text-stroke-color:./;
    static override colorStarts = 'text-stroke:';
    static override colorful = true;
    override get props(): { [key: string]: any } {
        return {
            '-webkit-text-stroke-color': this
        };
    }
}