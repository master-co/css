import { CONDITION_COMPARABLE_FEATURES, CONDITION_COMPARISON_OPERATORS, CONDITION_FEATURE_ALIASES, CONDITION_IDENTIFIERS, CONDITION_LOGICAL_OPERATORS } from '../common'
import type MasterCSS from '../core'
import type { MasterCSSManifestConditionIdentifier } from '@master/css-schema/manifest'
import parsePair from './parse-pair'
import parseValue from './parse-value'
import replaceCharOutsideQuotes from './replace-char-outside-quotes'
import splitCharOutsideQuotes from './split-char-outside-quotes'

export type Condition = {
  id: MasterCSSManifestConditionIdentifier
  nodes: ConditionNode[]
}
export declare type ConditionBooleanNode = { raw?: string, name: string, type: 'boolean' }
export declare type ConditionNumberNode = { raw?: string, name: string, type: 'number', value: number, unit?: string, operator?: string }
export declare type ConditionStringNode = { raw?: string, name: string, type: 'string', value: string }
export declare type ConditionValueNode = ConditionNumberNode | ConditionStringNode
export interface ConditionComparisonOperatorNode { type: 'comparison', raw?: string, value: string }
export interface ConditionLogicalOperatorNode { type: 'logical', raw?: string, value: string }
export type ConditionOperatorNode = ConditionComparisonOperatorNode | ConditionLogicalOperatorNode
export interface ConditionGroupNode { type?: 'group', raw?: string, children: ConditionNode[] }
export type ConditionNode = ConditionBooleanNode | ConditionValueNode | ConditionComparisonOperatorNode | ConditionLogicalOperatorNode | ConditionGroupNode

function resolveConditionFeatureName(value: string) {
  return CONDITION_FEATURE_ALIASES[value as keyof typeof CONDITION_FEATURE_ALIASES] || value
}

function isConditionFeatureName(value: string) {
  return CONDITION_COMPARABLE_FEATURES.includes(resolveConditionFeatureName(value))
}

function isConditionIdentifier(value: string): value is MasterCSSManifestConditionIdentifier {
  return (CONDITION_IDENTIFIERS as string[]).includes(value)
}

export default function parseCondition(token: string, css: MasterCSS, isRaw = true) {
  let id: MasterCSSManifestConditionIdentifier | undefined
  let firstToken: string | undefined
  const resolve = (token: string) => {
    const regex = /([a-zA-Z0-9-:%|]+|[&|!|,|>|<|=][=]?)/g
    const raws = [...token.matchAll(regex)].map(match => match[0])
    let nodes: ConditionNode[] = []
    const addNode = (node: ConditionNode) => {
      let prev = nodes[nodes.length - 1]
      if (node.type === 'number' && !node.name) {
        if (prev?.type === 'comparison') {
          node.operator = prev.value
          if (node.raw && prev.raw) {
            node.raw = prev.raw + node.raw
          }
          nodes.pop()
          prev = nodes[nodes.length - 1]
          if (prev?.type === 'string') {
            node.name = resolveConditionFeatureName(prev.value)
            if (node.raw && prev.raw) {
              node.raw = prev.raw + node.raw
            }
            nodes.pop()
          } else {
            node.name = 'width'
          }
        } else {
          node.name = 'width'
          node.operator = '>='
        }
      }
      nodes.push(node)
    }
    raws
      .forEach((raw, rawIndex) => {
        if (CONDITION_COMPARISON_OPERATORS.includes(raw)) {
          const newNode = { type: 'comparison', value: raw } as ConditionComparisonOperatorNode
          if (isRaw) newNode.raw = raw
          nodes.push(newNode)
          return
        } else if (raw in CONDITION_LOGICAL_OPERATORS) {
          const newNode = { type: 'logical', value: CONDITION_LOGICAL_OPERATORS[raw as keyof typeof CONDITION_LOGICAL_OPERATORS] } as ConditionLogicalOperatorNode
          if (isRaw) newNode.raw = raw
          nodes.push(newNode)
          return
        }
        const definedCondition = id === 'container'
          ? css.containerConditions.get(raw)
          || (css.breakpointConditions.has(raw) ? undefined : css.conditions.get(raw))
          : css.conditions.get(raw)
        if (!id && !firstToken) {
          firstToken = raw
          if (isConditionIdentifier(firstToken)) {
            id = firstToken
            return
          } else if (definedCondition) {
            id = definedCondition.id
          } else if (isConditionFeatureName(firstToken)) {
            id = 'media'
          } else if (firstToken.charAt(0).match(/[a-zA-Z-]/)) {
            id = 'container'
          } else {
            id = 'media'
          }
        }
        let node = { type: 'string' } as ConditionValueNode
        if (isRaw) node.raw = raw
        if (definedCondition) {
          if (definedCondition.nodes.length === 1) {
            addNode({ ...definedCondition.nodes[0], raw })
          } else if (definedCondition.nodes.length) {
            addNode({ raw, children: definedCondition.nodes })
          }
          return
        } else {
          const [splitedNameOrValue, splitedValue] = splitCharOutsideQuotes(raw, ':')
          if (splitedValue) {
            node.name = resolveConditionFeatureName(splitedNameOrValue)
            node.value = splitedValue
          } else {
            node.value = resolveConditionFeatureName(splitedNameOrValue)
          }
          if (id === 'container' || id === 'media') {
            const featureValue = String(node.value)
            if (!splitedValue && isConditionFeatureName(featureValue)) {
              if (CONDITION_COMPARISON_OPERATORS.includes(raws[rawIndex + 1])) {
                addNode(node)
              } else {
                addNode({
                  type: 'boolean',
                  name: featureValue,
                  ...(isRaw && { raw })
                })
              }
              return
            } else {
              const { token, ...newNode } = parseValue(node.value, 'rem', css.settings.rootSize)
              Object.assign(node, newNode)
            }
          }
          addNode(node)
        }
      })

    return nodes
  }

  const pair = (token: string) => {
    const pairedConditionNodes: ConditionNode[] = []
    const paired = parsePair(token)
    if (paired) {
      if (paired.pre) {
        pairedConditionNodes.push(...pair(paired.pre))
      }
      if (paired.body) {
        if (id === 'supports') {
          pairedConditionNodes.push({
            type: 'group',
            children: [{
              type: 'string',
              value: replaceCharOutsideQuotes(paired.body, '|', ' '),
            } as ConditionStringNode]
          })
        } else {
          const children = pair(paired.body)
          if (children.length > 1) {
            pairedConditionNodes.push({
              type: 'group', children: pair(paired.body)
            } as unknown as ConditionGroupNode)
          } else {
            pairedConditionNodes.push(...children)
          }
        }
      }
      if (paired.post) {
        pairedConditionNodes.push(...pair(paired.post))
      }
    } else {
      pairedConditionNodes.push(...resolve(token))
    }
    return pairedConditionNodes
  }
  return {
    nodes: pair(token),
    id: id || 'media' // should be assigned to here
  } as Condition
}
