import { ANTIALIASED, AUTO, dash, FONT, GRAYSCALE, SMOOTHING, SUBPIXEL } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';
import { MOZ_PREFIX, WEBKIT_PREFIX } from '../constants/css-browser-prefix';

const SUBPIXEL_ANTIALIASED = dash(SUBPIXEL, ANTIALIASED);
const WEBKIT_FONT_SMOOTHING = dash(WEBKIT_PREFIX + FONT, SMOOTHING);
const MOZ_OSXFONT_SMOOTHING = dash(MOZ_PREFIX + 'osx' + FONT, SMOOTHING);

export class FontSmoothing extends MasterCSSRule {
    static override matches = /^f(ont)?:(antialiased|subpixel-antialiased)(?!\|)/;
    static override unit = '';
    override get(declaration): { [key: string]: any } {
        const props = {};
        switch (declaration.value) {
            case SUBPIXEL_ANTIALIASED:
                props[WEBKIT_FONT_SMOOTHING] = props[MOZ_OSXFONT_SMOOTHING] = {
                    ...declaration,
                    value: AUTO
                }
                break;
            case ANTIALIASED:
                props[WEBKIT_FONT_SMOOTHING] = {
                    ...declaration,
                    value: ANTIALIASED
                }
                props[MOZ_OSXFONT_SMOOTHING] = {
                    ...declaration,
                    value: GRAYSCALE
                }
                break;
            // default:
            //     props[WEBKIT_FONT_SMOOTHING] = props[MOZ_OSXFONT_SMOOTHING] = this;
        }
        return props;
    };
}