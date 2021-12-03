import { MOZ_PREFIX, OSX, WEBKIT_PREFIX } from './constants/css-browser-prefix';
import { ANTIALIASED, AUTO, DASH, FONT, F_PREFIX, GRAYSCALE, SHARP, SMOOTH, SMOOTHING, SUBPIXEL, WEIGHT } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

const WEBKIT_FONT_SMOOTHING = WEBKIT_PREFIX + FONT + DASH + SMOOTHING;
const MOZ_OSX_FONT_SMOOTHING = MOZ_PREFIX + OSX + FONT + DASH + SMOOTHING;

export class MasterFontSmoothingStyle extends MasterStyle {
    static override defaultUnit = '';
    static override semantics = {
        [F_PREFIX + SMOOTH]: {
            [WEBKIT_FONT_SMOOTHING]: ANTIALIASED,
            [MOZ_OSX_FONT_SMOOTHING]: GRAYSCALE
        },
        [F_PREFIX + SHARP]: {
            [WEBKIT_FONT_SMOOTHING]: AUTO,
            [MOZ_OSX_FONT_SMOOTHING]: AUTO
        }
    }
}