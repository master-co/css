import { compareRulePriority, type GeneratedRule, type MasterCSS } from '@master/css-engine'
import UtilityType from '@master/css-schema/utility-type'

const LAYER_ORDER = ['theme', 'base', 'defaults', 'components', 'utilities']
const UNKNOWN_PROPERTY_GROUP_ORDER = 99
const UNKNOWN_PROPERTY_ORDER = 99

type SortableRule = Parameters<typeof compareRulePriority>[0]

interface ReadablePropertyOrder {
  group: number
  order: number
}

interface ClassSortDescriptor extends ReadablePropertyOrder {
  className: string
  rule?: GeneratedRule
  layerOrder: number
  conditionGroupOrder: number
  typeOrder: number
  conditionRule?: SortableRule
}

function getLayerOrder(layerName?: string) {
  const index = LAYER_ORDER.indexOf(layerName || 'utilities')
  return index === -1 ? LAYER_ORDER.length : index
}

function getConditionGroupOrder(rule: { conditions?: unknown, mode?: unknown, selectorNodes?: unknown[] }) {
  if (rule.conditions) return 3
  if (rule.mode) return 2
  if (rule.selectorNodes?.length) return 1
  return 0
}

function getReadableTypeOrder(rule: { fixedClass?: string, type?: number }) {
  if (rule.fixedClass) return 0
  if (rule.type === UtilityType.Semantic) return 1
  return 2
}

function createConditionRule(rule: GeneratedRule): SortableRule {
  return {
    conditions: rule.conditions,
    key: '',
    mode: rule.mode,
    priority: rule.priority,
    selectorNodes: rule.selectorNodes,
    type: 0
  }
}

function isProperty(property: string, name: string) {
  return property === name
}

function isPropertyPrefix(property: string, prefix: string) {
  return property === prefix || property.startsWith(prefix + '-')
}

function isInsetProperty(property: string) {
  return property === 'top'
    || property === 'right'
    || property === 'bottom'
    || property === 'left'
    || isPropertyPrefix(property, 'inset')
}

function getPropertyOrder(property: string): ReadablePropertyOrder {
  if (isProperty(property, 'position')) return { group: 0, order: 0 }
  if (isInsetProperty(property)) return { group: 0, order: 1 }
  if (isProperty(property, 'z-index')) return { group: 0, order: 2 }
  if (isProperty(property, 'display')) return { group: 0, order: 3 }
  if (isProperty(property, 'visibility')) return { group: 0, order: 4 }
  if (isPropertyPrefix(property, 'overflow')) return { group: 0, order: 5 }
  if (isPropertyPrefix(property, 'container')) return { group: 0, order: 6 }
  if (isProperty(property, 'isolation')) return { group: 0, order: 7 }
  if (isProperty(property, 'float')) return { group: 0, order: 8 }
  if (isProperty(property, 'clear')) return { group: 0, order: 9 }

  if (isPropertyPrefix(property, 'flex')) return { group: 1, order: 0 }
  if (isPropertyPrefix(property, 'grid')) return { group: 1, order: 1 }
  if (isPropertyPrefix(property, 'place')) return { group: 1, order: 2 }
  if (isPropertyPrefix(property, 'align')) return { group: 1, order: 3 }
  if (isPropertyPrefix(property, 'justify')) return { group: 1, order: 4 }
  if (isPropertyPrefix(property, 'gap')) return { group: 1, order: 5 }
  if (isProperty(property, 'order')) return { group: 1, order: 6 }
  if (isPropertyPrefix(property, 'columns')) return { group: 1, order: 7 }

  if (isProperty(property, 'height')) return { group: 2, order: 0 }
  if (isProperty(property, 'width')) return { group: 2, order: 1 }
  if (isPropertyPrefix(property, 'min')) return { group: 2, order: 2 }
  if (isPropertyPrefix(property, 'max')) return { group: 2, order: 3 }
  if (isProperty(property, 'size')) return { group: 2, order: 4 }
  if (isProperty(property, 'aspect-ratio')) return { group: 2, order: 5 }

  if (isPropertyPrefix(property, 'margin')) return { group: 3, order: 0 }
  if (isPropertyPrefix(property, 'padding')) return { group: 3, order: 1 }
  if (isPropertyPrefix(property, 'scroll-margin')) return { group: 3, order: 2 }
  if (isPropertyPrefix(property, 'scroll-padding')) return { group: 3, order: 3 }

  if (isPropertyPrefix(property, 'border')) return { group: 4, order: 0 }
  if (isPropertyPrefix(property, 'outline')) return { group: 4, order: 1 }

  if (isPropertyPrefix(property, 'font')) return { group: 5, order: 0 }
  if (isProperty(property, 'line-height')) return { group: 5, order: 1 }
  if (isProperty(property, 'letter-spacing')) return { group: 5, order: 2 }
  if (isPropertyPrefix(property, 'text')) return { group: 5, order: 3 }
  if (isProperty(property, 'white-space')) return { group: 5, order: 4 }
  if (isPropertyPrefix(property, 'word')) return { group: 5, order: 5 }
  if (isPropertyPrefix(property, 'list-style')) return { group: 5, order: 6 }

  if (isPropertyPrefix(property, 'background')) return { group: 6, order: 0 }
  if (isProperty(property, 'color')) return { group: 6, order: 1 }
  if (isProperty(property, 'fill')) return { group: 6, order: 2 }
  if (isProperty(property, 'stroke')) return { group: 6, order: 3 }
  if (isProperty(property, 'accent-color')) return { group: 6, order: 4 }
  if (isProperty(property, 'caret-color')) return { group: 6, order: 5 }
  if (isPropertyPrefix(property, 'mask')) return { group: 6, order: 6 }

  if (isProperty(property, 'opacity')) return { group: 7, order: 0 }
  if (isProperty(property, 'box-shadow')) return { group: 7, order: 1 }
  if (isProperty(property, 'filter')) return { group: 7, order: 2 }
  if (isProperty(property, 'backdrop-filter')) return { group: 7, order: 3 }
  if (isProperty(property, 'mix-blend-mode')) return { group: 7, order: 4 }
  if (isProperty(property, 'transform')) return { group: 7, order: 5 }
  if (isProperty(property, 'translate')) return { group: 7, order: 6 }
  if (isProperty(property, 'scale')) return { group: 7, order: 7 }
  if (isProperty(property, 'rotate')) return { group: 7, order: 8 }
  if (isPropertyPrefix(property, 'transition')) return { group: 7, order: 9 }
  if (isPropertyPrefix(property, 'animation')) return { group: 7, order: 10 }

  if (isProperty(property, 'cursor')) return { group: 8, order: 0 }
  if (isProperty(property, 'pointer-events')) return { group: 8, order: 1 }
  if (isProperty(property, 'user-select')) return { group: 8, order: 2 }
  if (isProperty(property, 'touch-action')) return { group: 8, order: 3 }
  if (isProperty(property, 'resize')) return { group: 8, order: 4 }
  if (isPropertyPrefix(property, 'scroll')) return { group: 8, order: 5 }
  if (isPropertyPrefix(property, 'overscroll')) return { group: 8, order: 6 }
  if (isProperty(property, 'appearance')) return { group: 8, order: 7 }

  return { group: UNKNOWN_PROPERTY_GROUP_ORDER, order: UNKNOWN_PROPERTY_ORDER }
}

function comparePropertyOrder(a: ReadablePropertyOrder, b: ReadablePropertyOrder) {
  return a.group - b.group || a.order - b.order
}

function getReadablePropertyOrder(rule: GeneratedRule): ReadablePropertyOrder {
  let best: ReadablePropertyOrder = { group: UNKNOWN_PROPERTY_GROUP_ORDER, order: UNKNOWN_PROPERTY_ORDER }
  const declarationGroups = [
    ...(rule.declarations ? [rule.declarations] : []),
    ...(rule.declarationRules?.map(({ declarations }) => declarations) || [])
  ]

  for (const declarations of declarationGroups) {
    for (const property of Object.keys(declarations)) {
      const next = getPropertyOrder(property)
      if (comparePropertyOrder(next, best) < 0) {
        best = next
      }
    }
  }

  return best
}

function createClassSortDescriptor(className: string, css: MasterCSS): ClassSortDescriptor {
  const rule = css.generate(className)[0]
  if (!rule) {
    return {
      className,
      group: UNKNOWN_PROPERTY_GROUP_ORDER,
      order: UNKNOWN_PROPERTY_ORDER,
      layerOrder: LAYER_ORDER.length,
      conditionGroupOrder: 0,
      typeOrder: 0
    }
  }

  const readablePropertyOrder = getReadablePropertyOrder(rule)
  return {
    className,
    rule,
    conditionGroupOrder: getConditionGroupOrder(rule),
    conditionRule: createConditionRule(rule),
    layerOrder: getLayerOrder(rule.layerName),
    typeOrder: getReadableTypeOrder(rule),
    ...readablePropertyOrder
  }
}

export default function sortClassNames(classNames: string[], css: MasterCSS) {
  const descriptors = [...new Set(classNames)].map((className) => createClassSortDescriptor(className, css))
  return descriptors.sort((a, b) => {
    if (!a.rule && !b.rule) return a.className.localeCompare(b.className)
    if (!a.rule) return 1
    if (!b.rule) return -1
    const layerCmp = a.layerOrder - b.layerOrder
    if (layerCmp !== 0) return layerCmp
    const conditionGroupCmp = a.conditionGroupOrder - b.conditionGroupOrder
    if (conditionGroupCmp !== 0) return conditionGroupCmp
    const conditionCmp = a.conditionRule && b.conditionRule
      ? compareRulePriority(a.conditionRule, b.conditionRule)
      : 0
    if (conditionCmp !== 0) return conditionCmp
    const propertyCmp = comparePropertyOrder(a, b)
    if (propertyCmp !== 0) return propertyCmp
    const typeCmp = a.typeOrder - b.typeOrder
    if (typeCmp !== 0) return typeCmp
    return compareRulePriority(a.rule, b.rule) || a.className.localeCompare(b.className)
  }).map(({ className }) => className)
}
