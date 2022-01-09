import { MOZ_PREFIX, OSX, WEBKIT_PREFIX } from './constants/css-browser-prefix';
import { ANTIALIASED, AUTO, DASH, FONT, GRAYSCALE, SMOOTH, SMOOTHING } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class FontSmoothStyle extends Style {
    static override matches = /^f(ont)?:(smooth|sharp)(?!;)/;
    static override unit = '';
    override get props(): { [key: string]: any } {
        const isSmooth = this.value === SMOOTH;
        return {
            '-webkit-font-smoothing': {
                ...this,
                value: isSmooth
                    ? ANTIALIASED
                    : AUTO
            },
            '-moz-osxfont-smoothing': {
                ...this,
                value: isSmooth
                    ? GRAYSCALE
                    : AUTO
            }
        };
    };
}