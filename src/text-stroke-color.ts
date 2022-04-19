import { Style } from '@master/style';

export class TextStrokeColorStyle extends Style {
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