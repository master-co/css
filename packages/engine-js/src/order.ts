// Rule order within a CSS layer, as `compare_stored_rules` in the engine's utility.rs
// sorts it: sort tier, condition features and text, selector priority, utility type,
// value source, declarations, key, then manifest order.
import { compareText, isAsciiDigit } from './text'
import type { ConditionBound, ConditionFeature, GeneratedRule } from './types'

export interface StoredRule {
  ir: GeneratedRule
  /** The condition features rules sort by. The reported ones write `-0` as `0`, as the Rust JSON does. */
  features: ConditionFeature[]
  manifestOrder: number
  declarations: string
  nativeFallback: boolean
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
  return sign(a.sortTier - b.sortTier)
    || compareConditionFeatures(left.features, right.features)
    || compareConditions(a.priority.conditions, b.priority.conditions)
    || sign(a.priority.selector - b.priority.selector)
    || sign(a.type - b.type)
    || sign((a.priority.valuePriority ?? 0) - (b.priority.valuePriority ?? 0))
    || naturalCompare(a.priority.sortKey ?? '', b.priority.sortKey ?? '')
    || naturalCompare(a.key, b.key)
    || sign(left.manifestOrder - right.manifestOrder)
}
