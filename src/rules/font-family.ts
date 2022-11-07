import Rule from '../rule'

export default class extends Rule {
    static override id = 'FontFamily'
    static override matches = /^f(ont)?:(mono|sans|serif)(?!\|)/
}