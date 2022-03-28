import { Style } from '@master/style';

export class TextFillColorStyle extends Style {
    static override matches = /^text-fill-color:./;
    static override colorStarts = 'text-fill:';
    static override colorful = true;
    override get props(): { [key: string]: any } {
        return {
            '-webkit-text-fill-color': this
        };
    }
}