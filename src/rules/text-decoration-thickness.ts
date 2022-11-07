import Rule from '../rule'

export default class extends Rule {
    static override id = 'TextDecorationThickness'
    static override matches = /^text-decoration:(from-font(?!\|)|([0-9]|(max|min|calc|clamp)\(.*\))((?!\|).)*$)/
    static override unit = 'em'
}