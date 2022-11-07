import Rule from '../rule'

export default class extends Rule {
    static override id: 'FlexDirection' = 'FlexDirection' as const
    static override matches = /^flex:((row|col|column)(-reverse)?)(?!\|)/
}