import { Style } from '../style';

export class TextStrokeWidth extends Style {
    static id = 'textStrokeWidth';
    static override matches = /^text-stroke(:((thin|medium|thick)(?!\|)|\.?\d((?!\|).)*$)|-width:.)/;
    override get props(): { [key: string]: any } {
        return {
            '-webkit-text-stroke-width': this
        };
    }
}