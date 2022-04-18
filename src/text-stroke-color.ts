import { Style } from '@master/style';

export class TextStrokeColor extends Style {
    static override matches = /^text-stroke-color:./;
    static override colorStarts = 'text-stroke:';
    static override colorful = true;
    override get props(): { [key: string]: any } {
        return {
            '-webkit-text-stroke-color': this
        };
    }
}