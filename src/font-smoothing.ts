import { MOZ_PREFIX, OSX, WEBKIT_PREFIX } from './constants/css-browser-prefix';
import { ANTIALIASED, AUTO, DASH, FONT, GRAYSCALE, SMOOTH, SMOOTHING } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class FontSmoothingStyle extends Style {
    static override matches = /^f(ont)?:(smooth|sharp)$/;
    static override unit = '';
    override get props(): { [key: string]: any } {
        const isSmooth = this.value === SMOOTH;
        return {
            [WEBKIT_PREFIX + FONT + DASH + SMOOTHING]: {
                ...this,
                value: isSmooth
                    ? ANTIALIASED
                    : AUTO
            },
            [MOZ_PREFIX + OSX + FONT + DASH + SMOOTHING]: {
                ...this,
                value: isSmooth
                    ? GRAYSCALE
                    : AUTO
            }
        };
    };
}