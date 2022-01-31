import { ANTIALIASED, AUTO, DASH, GRAYSCALE, SUBPIXEL } from './constants/css-property-keyword';
import { Style } from '@master/style';

const SUBPIXEL_ANTIALIASED = SUBPIXEL + DASH + ANTIALIASED;
const WEBKIT_FONT_SMOOTHING = '-webkit-font-smoothing';
const MOZ_OSXFONT_SMOOTHING = '-moz-osxfont-smoothing';

export class FontSmoothStyle extends Style {
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