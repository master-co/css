// Rule order within a CSS layer, as `compare_stored_rules` in the engine's utility.rs
// sorts it: sort tier, condition features and text, selector priority, rule category
// (recipe, named atomic, native), then for atomics family, coverage, value source and
// property, otherwise utility type and value source; then declarations and key. Rule
// shapes follow the engine's ordering.rs.
import { asciiLowercase, compareText, isAsciiDigit } from './text'
import type { ConditionBound, ConditionFeature, GeneratedRule } from './types'

export interface StoredRule {
  ir: GeneratedRule
  /** The condition features rules sort by. The reported ones write `-0` as `0`, as the Rust JSON does. */
  features: ConditionFeature[]
}

const sign = (value: number) => value < 0 ? -1 : value > 0 ? 1 : 0

/** Rust `f64::total_cmp`; condition bounds are never NaN. */
const compareNumber = (left: number, right: number) => left < right ? -1 : left > right ? 1 : Object.is(left, right) ? 0 : Object.is(left, -0) ? -1 : Object.is(right, -0) ? 1 : 0

/** Text order that compares runs of ASCII digits by value, then by spelling. */
export function naturalCompare(left: string, right: string) {
  // A shared prefix compares equal unless it ends inside a digit run, so start
  // at the first difference, or at the start of the digit run it splits.
  let i = 0
  const length = Math.min(left.length, right.length)
  while (i < length && left.charCodeAt(i) === right.charCodeAt(i)) i++
  if (i === left.length && i === right.length) return 0
  while (i > 0 && isAsciiDigit(left.charCodeAt(i - 1))) i--
  let j = i
  for (;;) {
    if (i >= left.length) return j >= right.length ? 0 : -1
    if (j >= right.length) return 1
    if (isAsciiDigit(left.charCodeAt(i)) && isAsciiDigit(right.charCodeAt(j))) {
      const leftStart = i
      const rightStart = j
      while (isAsciiDigit(left.charCodeAt(i))) i++
      while (isAsciiDigit(right.charCodeAt(j))) j++
      const leftDigits = left.slice(leftStart, i)
      const rightDigits = right.slice(rightStart, j)
      const order = sign(leftDigits.replace(/^0+/, '').length - rightDigits.replace(/^0+/, '').length)
        || compareText(leftDigits, rightDigits)
      if (order) return order
      continue
    }
    const leftPoint = left.codePointAt(i)!
    const rightPoint = right.codePointAt(j)!
    if (leftPoint !== rightPoint) return leftPoint < rightPoint ? -1 : 1
    i += leftPoint > 0xffff ? 2 : 1
    j += rightPoint > 0xffff ? 2 : 1
  }
}

const lower = (range: ConditionFeature) => range.lower ? range.lower.value : -Infinity
const upper = (range: ConditionFeature) => range.upper ? range.upper.value : Infinity
/** Rust `Option<bool>` order: `None` before `false` before `true`. */
const inclusiveRank = (bound: ConditionBound | null) => bound ? (bound.inclusive ? 2 : 1) : 0

export function compareConditionFeatures(left: ConditionFeature[], right: ConditionFeature[]) {
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    if (index >= left.length) return -1
    if (index >= right.length) return 1
    const a = left[index]
    const b = right[index]
    const identity = naturalCompare(a.domain, b.domain) || naturalCompare(a.feature, b.feature) || naturalCompare(a.unit, b.unit)
    if (identity) return identity
    const unbounded = !a.upper && !b.upper
      ? compareNumber(lower(a), lower(b))
      : !a.lower && !b.lower ? compareNumber(upper(b), upper(a)) : 0
    const order = unbounded
      || compareNumber(upper(b) - lower(b), upper(a) - lower(a))
      || compareNumber(lower(b), lower(a))
      || compareNumber(upper(b), upper(a))
      || sign(inclusiveRank(b.lower) - inclusiveRank(a.lower))
      || sign(inclusiveRank(b.upper) - inclusiveRank(a.upper))
    if (order) return order
  }
  return 0
}

function compareConditions(left: string[] = [], right: string[] = []) {
  for (let index = 0; index < Math.min(left.length, right.length); index++) {
    const order = compareText(left[index], right[index])
    if (order) return order
  }
  return sign(left.length - right.length)
}

export function compareStoredRules(left: StoredRule, right: StoredRule) {
  const a = left.ir
  const b = right.ir
  const p = a.priority
  const q = b.priority
  return sign(a.sortTier - b.sortTier)
    || compareConditionFeatures(left.features, right.features)
    || compareConditions(p.conditions, q.conditions)
    || sign(p.selector - q.selector)
    || sign(p.category - q.category)
    // Only atomics carry a family, coverage and property; only others compare types.
    || compareText(p.family ?? '', q.family ?? '')
    || sign((p.coverage ?? 0) - (q.coverage ?? 0))
    || (p.category !== ATOMIC && sign(a.type - b.type))
    || sign((p.valuePriority ?? 0) - (q.valuePriority ?? 0))
    || compareText(p.property ?? '', q.property ?? '')
    || naturalCompare(p.sortKey ?? '', q.sortKey ?? '')
    || naturalCompare(a.key, b.key)
}

/** Several declarations, or an inner selector or condition. */
export const RECIPE = 0
/** One declaration of a named static, token or function utility. */
export const ATOMIC = 1
/** A `(property:value)` head. */
export const NATIVE = 2

/** The shape a rule sorts by: its category and, for atomics, family placement and declaration. */
export interface RuleShape {
  category: number
  family?: string
  coverage?: number
  property?: string
  content?: string
}

export const atomicShape = (property: string, value: string): RuleShape => {
  const [family, coverage] = propertyFamily(property)
  return { category: ATOMIC, family, coverage, property, content: `${property}:${value}` }
}

// A box family name, then an optional axis or side: `margin`, `margin-inline`, `margin-top`.
const BOX = /^(margin|padding|scroll-margin|scroll-padding|inset)(-(inline|block)(-start|-end)?|-(top|right|bottom|left))?$/
// A border width, style or color, with the same optional axis or side before the kind.
const BORDER = /^border(-(inline|block)(-start|-end)?|-(top|right|bottom|left))?-(width|style|color)$/
const AXIS = /^(?:(row|column)-gap|overflow-(?:x|y|inline|block))$/
const CORNER = /^border-(?:(?:top|bottom)-(?:left|right)|(?:start|end)-(?:start|end))-radius$/
const coverage = (side?: string, axis?: string, end?: string) => side || end ? 2 : axis ? 1 : 0

/**
 * The family a property belongs to and its coverage in it, as `property_family` in the
 * engine's ordering.rs: 0 sets the whole family, 1 an axis and 2 one side or corner.
 * Custom properties are case-sensitive families of their own; other unlisted
 * properties, shorthands included, are their own family.
 */
export function propertyFamily(property: string): [family: string, coverage: number] {
  if (property.startsWith('--')) return [property, 0]
  property = asciiLowercase(property)
  let match = BOX.exec(property)
  if (match) return [match[1], coverage(match[5], match[3], match[4])]
  if (/^(top|right|bottom|left)$/.test(property)) return ['inset', 2]
  if ((match = BORDER.exec(property))) return [`border-${match[5]}`, coverage(match[4], match[2], match[3])]
  if ((match = AXIS.exec(property))) return [match[1] ? 'gap' : 'overflow', 1]
  return CORNER.test(property) ? ['border-radius', 2] : [property, 0]
}
