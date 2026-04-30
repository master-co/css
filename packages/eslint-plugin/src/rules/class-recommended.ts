import defineVisitors from '../utils/define-visitors'
import resolveContext from '../utils/resolve-context'
import createRule from '../create-rule'
import settingsSchema from '../settings-schema'

/**
 * Issue #338 — recommend more idiomatic class shorthands.
 *
 * The first batch of recommendations focuses on axis collapses that have
 * an unambiguous canonical form:
 *
 *   - mt:N + mr:N + mb:N + ml:N      → m:N
 *   - mt:N + mb:N                    → my:N
 *   - ml:N + mr:N                    → mx:N
 *   - same for padding (pt/pb/pl/pr → p / py / px)
 *   - same for inset (top/right/bottom/left → inset / inset-y / inset-x — when
 *     the user's choosing the long-hands explicitly)
 *
 * Additional rules can be slotted into RECOMMENDATIONS below; each describes
 * a set of "long-hand" keys that collapse to a "shorthand" key when all
 * value tokens are equal and conditional-query suffixes match.
 */

interface ClassParse {
    raw: string                  // full token, e.g. mt:8@sm:hover
    head: string                 // key:value (no conditions), e.g. mt:8
    rule: string                 // rule key, e.g. mt
    value: string                // value, e.g. 8
    suffix: string               // conditional-query suffixes, e.g. @sm:hover
    important: boolean           // !important suffix
}

function parseClass(raw: string): ClassParse | null {
    // Allow trailing ! for important.
    const important = raw.endsWith('!')
    const core = important ? raw.slice(0, -1) : raw
    // Split on conditional-query suffix markers (@/~/:state) at the
    // FIRST `@` or `:` that comes AFTER the value separator `:`.
    const sepIndex = core.indexOf(':')
    if (sepIndex < 0) return null
    const rule = core.slice(0, sepIndex)
    const after = core.slice(sepIndex + 1)
    // The value ends at the next `@`, ` `, or non-trailing `:` — but pseudo
    // states like `:hover`, breakpoints `@sm`, conditional queries `~print`
    // are conditional suffixes. Match value as everything up to the first
    // `@` / `~` / `:`.
    const m = /^([^@~:]*)(.*)$/.exec(after)
    if (!m) return null
    const value = m[1]
    const suffix = m[2]
    if (!rule || !value) return null
    return { raw, head: `${rule}:${value}`, rule, value, suffix, important }
}

interface Rec {
    /** Long-hand rule keys (any 2 or 4) that collapse together. */
    longhands: string[]
    /** Resulting shorthand rule key. */
    shorthand: string
    /** Human description for the warning. */
    label: string
}

const RECOMMENDATIONS: Rec[] = [
    // margin
    { longhands: ['mt', 'mr', 'mb', 'ml'], shorthand: 'm',  label: 'margin' },
    { longhands: ['mt', 'mb'],             shorthand: 'my', label: 'margin-y' },
    { longhands: ['ml', 'mr'],             shorthand: 'mx', label: 'margin-x' },
    // padding
    { longhands: ['pt', 'pr', 'pb', 'pl'], shorthand: 'p',  label: 'padding' },
    { longhands: ['pt', 'pb'],             shorthand: 'py', label: 'padding-y' },
    { longhands: ['pl', 'pr'],             shorthand: 'px', label: 'padding-x' },
    // inset
    { longhands: ['top', 'right', 'bottom', 'left'], shorthand: 'inset', label: 'inset' },
    { longhands: ['top', 'bottom'],                  shorthand: 'inset-y', label: 'inset-y' },
    { longhands: ['left', 'right'],                  shorthand: 'inset-x', label: 'inset-x' },
]

export default createRule({
    name: 'class-recommended',
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Suggest collapsing related long-hand utilities into the equivalent shorthand'
        },
        messages: {
            recommend: '{{message}}',
        },
        fixable: 'code',
        schema: [settingsSchema]
    },
    defaultOptions: [],
    create(context) {
        const { settings } = resolveContext(context)
        return defineVisitors({ context, settings }, (_node, { raw, start, end, classNodes }) => {
            // Build a map: head ("rule:value") → list of class nodes that share it
            // Per recommendation: for each (group of long-hands), collect class nodes
            // whose `rule` is in the group AND `value` is identical AND `suffix`/`important` match.
            // If the group is fully covered, emit a warning.
            const parsed: { node: any, p: ClassParse }[] = []
            for (const cn of classNodes) {
                const p = parseClass(cn.value)
                if (p) parsed.push({ node: cn, p })
            }

            const reported = new Set<any>()  // class nodes already covered by a 4-side recommendation

            for (const rec of RECOMMENDATIONS) {
                // Bucket parsed classes by (value+suffix+important) so we only consider
                // candidates that share value AND modifier conditions.
                const buckets = new Map<string, Map<string, { node: any, p: ClassParse }>>()
                for (const item of parsed) {
                    if (reported.has(item.node)) continue
                    if (!rec.longhands.includes(item.p.rule)) continue
                    const key = `${item.p.value}|${item.p.suffix}|${item.p.important}`
                    let bucket = buckets.get(key)
                    if (!bucket) {
                        bucket = new Map()
                        buckets.set(key, bucket)
                    }
                    bucket.set(item.p.rule, item)
                }

                for (const [, m] of buckets) {
                    if (m.size !== rec.longhands.length) continue
                    if (rec.longhands.some((h) => !m.has(h))) continue
                    const items = rec.longhands.map((h) => m.get(h) as { node: any, p: ClassParse })
                    const sample = items[0]
                    const replacementHead = `${rec.shorthand}:${sample.p.value}${sample.p.suffix}${sample.p.important ? '!' : ''}`
                    const present = items.map((i) => i.node.value).join(', ')
                    context.report({
                        loc: items[0].node.loc,
                        messageId: 'recommend',
                        data: {
                            message: `Use \`${replacementHead}\` instead of ${present} (collapse to ${rec.label} shorthand).`
                        },
                        fix(fixer) {
                            // Single replaceTextRange covering the whole affected span,
                            // so adjacent removals don't trigger ESLint's "overlapped fix"
                            // guard. The span runs from the first long-hand's start to the
                            // last long-hand's end; we re-emit the whole thing with the
                            // first long-hand collapsed into the shorthand and the rest
                            // (plus their preceding whitespace) dropped.
                            const sortedNodes = items
                                .map((i) => i.node)
                                .sort((a, b) => a.range[0] - b.range[0])
                            const text = context.sourceCode.getText()
                            const spanStart = sortedNodes[0].range[0]
                            const spanEnd = sortedNodes[sortedNodes.length - 1].range[1]
                            const original = text.slice(spanStart, spanEnd)
                            // Walk the span: the first occurrence of any long-hand becomes
                            // the shorthand; all others (plus their preceding whitespace) drop.
                            const longhandValues = new Set(items.map((i) => i.node.value))
                            const tokens = original.split(/(\s+)/)  // keep whitespace separators
                            let firstReplaced = false
                            const out: string[] = []
                            for (const tk of tokens) {
                                if (longhandValues.has(tk)) {
                                    if (!firstReplaced) {
                                        out.push(replacementHead)
                                        firstReplaced = true
                                    } else {
                                        // drop the previous whitespace too (collapse)
                                        if (out.length > 0 && /^\s+$/.test(out[out.length - 1])) {
                                            out.pop()
                                        }
                                    }
                                } else {
                                    out.push(tk)
                                }
                            }
                            return fixer.replaceTextRange([spanStart, spanEnd], out.join(''))
                        }
                    })
                    items.forEach((i) => reported.add(i.node))
                }
            }
        })
    },
})
