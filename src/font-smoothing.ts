import { ANTIALIASED, AUTO, DASH, FONT, GRAYSCALE, SMOOTHING, SUBPIXEL } from './constants/css-property-keyword';
import { Style } from '@master/style';
import { MOZ_PREFIX, WEBKIT_PREFIX } from './constants/css-browser-prefix';

const SUBPIXEL_ANTIALIASED = SUBPIXEL + DASH + ANTIALIASED;
const WEBKIT_FONT_SMOOTHING = WEBKIT_PREFIX + FONT + DASH + SMOOTHING;
const MOZ_OSXFONT_SMOOTHING = MOZ_PREFIX + 'osx' + FONT + DASH + SMOOTHING;

export class FontSmoothingStyle extends Style {
    static id = 'fontSmoothing';
    static override matches = /^f(ont)?:(antialiased|subpixel-antialiased)(?!;)/;
    static override unit = '';
    override get props(): { [key: string]: any } {
        const props = {};
        switch (this.value) {
            case SUBPIXEL_ANTIALIASED:
                props[WEBKIT_FONT_SMOOTHING] = props[MOZ_OSXFONT_SMOOTHING] = {
                    ...this,
                    value: AUTO
                }
                break;
            case ANTIALIASED:
                props[WEBKIT_FONT_SMOOTHING] = {
                    ...this,
                    value: ANTIALIASED
                }
                props[MOZ_OSXFONT_SMOOTHING] = {
                    ...this,
                    value: GRAYSCALE
                }
                break;
            // default:
            //     props[WEBKIT_FONT_SMOOTHING] = props[MOZ_OSXFONT_SMOOTHING] = this;
        }
        return props;
    };
}