import Rule from '../rule'

export default class extends Rule {
    static override id = 'FlexDirection'
    static override matches = /^flex:((row|col|column)(-reverse)?)(?!\|)/
}