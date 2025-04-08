export class Rule {
    native?: CSSRule

    constructor(
        public readonly name: string,
        public readonly text: string,
    ) { }

    get key() {
        return this.name
    }
}