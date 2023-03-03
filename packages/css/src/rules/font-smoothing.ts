import { Rule } from '../rule'

const SUBPIXEL_ANTIALIASED = 'subpixel-antialiased'
const WEBKIT_FONT_SMOOTHING = '-webkit-font-smoothing'
const MOZ_OSXFONT_SMOOTHING = '-moz-osx-font-smoothing'

export default class extends Rule {
    static override id = 'FontSmoothing' as const
    static override matches = '^f(?:ont)?:(?:antialiased|subpixel-antialiased|$values)(?!\\|)'
    static override unit = ''
    static override get prop() { return '' }
    override get(declaration): { [key: string]: any } {
        const props = {}
        switch (declaration.value) {
        case SUBPIXEL_ANTIALIASED:
            props[WEBKIT_FONT_SMOOTHING] = props[MOZ_OSXFONT_SMOOTHING] = {
                ...declaration,
                value: 'auto'
            }
            break
        case 'antialiased':
            props[WEBKIT_FONT_SMOOTHING] = {
                ...declaration,
                value: 'antialiased'
            }
            props[MOZ_OSXFONT_SMOOTHING] = {
                ...declaration,
                value: 'grayscale'
            }
            break
            // default:
            //     props[WEBKIT_FONT_SMOOTHING] = props[MOZ_OSXFONT_SMOOTHING] = this;
        }
        return props
    }
}