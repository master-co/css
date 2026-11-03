// @ts-ignore
import * as Prism from 'prismjs/components/prism-core'

export default function fixSelectorEscapeTokens(tokens: Prism.Token[]) {
    for (let token of tokens) {
        if (typeof token === 'string') continue;
        if (token.type !== 'selector') continue;
        if (typeof token.content === 'string') {
            let splits = token.content.split('\\')
            for (let index = 0; index < splits.length; index++) {
                if (index === splits.length - 1) {
                    break;
                }
                const nextContentSplit = splits[index + 1];
                splits.splice(index + 1, 0, new Prism.Token('punctuation', '\\'))
                splits.splice(index + 2, 0, new Prism.Token('class', nextContentSplit[0]))
                splits[index + 3] = nextContentSplit.slice(1)
                index += 2;
            }
            token.content = splits;
        }
    }
}
