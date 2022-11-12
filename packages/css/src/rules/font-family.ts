import Rule from '../rule'

export default class extends Rule {
    static override id: 'FontFamily' = 'FontFamily' as const
    static override matches = /^f(ont)?:(mono|sans|serif)(?!\|)/
}