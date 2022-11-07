import Rule from '../rule'

export default class extends Rule {
    static override id = 'BackgroundSize'
    static override matches = /^(bg|background):((auto|cover|contain)(?!\|)|\.?\d((?!\|).)*$)/
}