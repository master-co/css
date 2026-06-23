export default function findNativeCSSRuleIndex(cssRules: CSSRuleList, nativeRule: CSSRule): number {
    for (let i = 0; i < cssRules.length; i++) {
        if (cssRules[i] === nativeRule) {
            return i
        }
    }
    return -1
}
