import Rule from '../rule'

const BORDER_TOP_LEFT_RADIUS = 'border-top-left-radius',
    BORDER_TOP_RIGHT_RADIUS = 'border-top-right-radius',
    BORDER_BOTTOM_LEFT_RADIUS = 'border-bottom-left-radius',
    BORDER_BOTTOM_RIGHT_RADIUS = 'border-bottom-right-radius',
    BORDER_RADIUS = 'border-radius',
    BORDER_RADIUS_S = [BORDER_TOP_LEFT_RADIUS, BORDER_TOP_RIGHT_RADIUS, BORDER_BOTTOM_LEFT_RADIUS, BORDER_BOTTOM_RIGHT_RADIUS]

export default class extends Rule {
    static override id: 'BorderRadius' = 'BorderRadius' as const
    static override matches = /^((r[tblr]?[tblr]?|border(-(top|bottom)-(left|right))?-radius):.)/
    static override prop = ''
    override get(declaration): { [key: string]: any } {
        if (this.prefix) {
            let suffix = ''
            const splits = this.prefix.split('-')
            if (splits.length > 1) {
                for (let i = 1; i < splits.length - 1; i++) {
                    suffix += splits[i][0]
                }
            } else {
                suffix = this.prefix.slice(1, -1)
            }
            switch (suffix) {
            case 't':
                return {
                    [BORDER_TOP_LEFT_RADIUS]: declaration,
                    [BORDER_TOP_RIGHT_RADIUS]: declaration
                }
            case 'tl':
            case 'lt':
                return {
                    [BORDER_TOP_LEFT_RADIUS]: declaration
                }
            case 'rt':
            case 'tr':
                return {
                    [BORDER_TOP_RIGHT_RADIUS]: declaration
                }
            case 'b':
                return {
                    [BORDER_BOTTOM_LEFT_RADIUS]: declaration,
                    [BORDER_BOTTOM_RIGHT_RADIUS]: declaration
                }
            case 'bl':
            case 'lb':
                return {
                    [BORDER_BOTTOM_LEFT_RADIUS]: declaration
                }
            case 'br':
            case 'rb':
                return {
                    [BORDER_BOTTOM_RIGHT_RADIUS]: declaration
                }
            case 'l':
                return {
                    [BORDER_TOP_LEFT_RADIUS]: declaration,
                    [BORDER_BOTTOM_LEFT_RADIUS]: declaration
                }
            case 'r':
                return {
                    [BORDER_TOP_RIGHT_RADIUS]: declaration,
                    [BORDER_BOTTOM_RIGHT_RADIUS]: declaration
                }
            default:
                return {
                    [BORDER_RADIUS]: declaration
                }
            }
        }

        const prefix = this.prefix?.slice(0, -1)
        return {
            [BORDER_RADIUS_S.includes(prefix) ? prefix : BORDER_RADIUS]: declaration
        }
    }
    override get order(): number {
        return (this.prefix === 'border-radius' + ':' || this.prefix === 'r:') ? -1 : 0
    }
}