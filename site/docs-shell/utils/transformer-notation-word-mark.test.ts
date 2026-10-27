import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import type { Element, ElementContent } from 'hast'
import transformerNotationWordMark from './transformer-notation-word-mark'
import { getTextContent } from './transformer-notation-word-mark'

test('@MARK highlights exact text without trailing whitespace inside a Shiki token', async () => {
  const directiveLine = createElement('span', [
    createElement('span', [createText('<!-- @MARK calc(100%-16) --><!-- @MARK $size-sm --><!-- @MARK black/.5 -->')])
  ])
  const codeLine = createElement('span', [
    createElement('span', [createText('<div class="w:')]),
    createElement('span', [createText('calc')]),
    createElement('span', [createText('(')]),
    createElement('span', [createText('100')]),
    createElement('span', [createText('%-')]),
    createElement('span', [createText('16')]),
    createElement('span', [createText(')')]),
    createElement('span', [createText(' h:')]),
    createElement('span', [createText('$size-sm ')]),
    createElement('span', [createText('bg:')]),
    createElement('span', [createText('black')]),
    createElement('span', [createText('/')]),
    createElement('span', [createText('.5')]),
    createElement('span', [createText('">')])
  ])
  const codeElement = createElement('code', [directiveLine, codeLine])
  const transformer = transformerNotationWordMark()
  const applyCodeTransform = transformer.code as ((element: Element) => void) | undefined

  applyCodeTransform?.(codeElement)

  const markedTexts = collectMarkedTexts(codeElement)

  assert.ok(markedTexts.includes('$size-sm'))
  assert.equal(markedTexts.includes('$size-sm '), false)
})

test('@MARK highlights conditional query ranges split across Shiki tokens', async () => {
  const directiveLine = createElement('span', [
    createElement('span', [createText('<!-- @MARK hidden@sm&<=md -->')])
  ])
  const codeLine = createElement('span', [
    createElement('span', [createText('<aside class="')]),
    createElement('span', [createText('hidden')]),
    createElement('span', [createText('@sm')]),
    createElement('span', [createText('&')]),
    createElement('span', [createText('<')]),
    createElement('span', [createText('=')]),
    createElement('span', [createText('md')]),
    createElement('span', [createText('">...</aside>')])
  ])
  const codeElement = createElement('code', [directiveLine, codeLine])
  const transformer = transformerNotationWordMark()
  const applyCodeTransform = transformer.code as ((element: Element) => void) | undefined

  applyCodeTransform?.(codeElement)

  assert.deepEqual(collectMarkedTexts(codeElement), [
    'hidden',
    '@sm',
    '&',
    '<',
    '=',
    'md'
  ])
})

test('@WARN and @ERROR add diagnostic mark classes', async () => {
  const directiveLine = createElement('span', [
    createElement('span', [createText('<!-- @WARN bg:yelow --><!-- @ERROR font: -->')])
  ])
  const codeLine = createElement('span', [
    createElement('span', [createText('<button class="')]),
    createElement('span', [createText('bg:yelow')]),
    createElement('span', [createText(' ')]),
    createElement('span', [createText('font:')]),
    createElement('span', [createText('">Save</button>')])
  ])
  const codeElement = createElement('code', [directiveLine, codeLine])
  const transformer = transformerNotationWordMark()
  const applyCodeTransform = transformer.code as ((element: Element) => void) | undefined

  applyCodeTransform?.(codeElement)

  assert.deepEqual(collectMarkedTexts(codeElement), ['bg:yelow', 'font:'])
  assert.ok(hasClassName(findTextElement(codeElement, 'bg:yelow'), 'code-mark-warn'))
  assert.ok(hasClassName(findTextElement(codeElement, 'font:'), 'code-mark-error'))
})

function createElement(tagName: string, children: ElementContent[], properties: Element['properties'] = {}): Element {
  return {
    type: 'element',
    tagName,
    properties,
    children
  }
}

function createText(value: string): ElementContent {
  return {
    type: 'text',
    value
  }
}

function collectMarkedTexts(element: Element): string[] {
  const texts: string[] = []
  visitElements(element, (child) => {
    if (hasClassName(child, 'mark')) {
      texts.push(getTextContent(child))
    }
  })
  return texts
}

function visitElements(element: Element, callback: (element: Element) => void) {
  callback(element)
  for (const child of element.children) {
    if (child.type === 'element') {
      visitElements(child, callback)
    }
  }
}

function hasClassName(element: Element, className: string): boolean {
  const classes = element.properties?.class
  if (Array.isArray(classes)) return classes.includes(className)
  if (typeof classes === 'string') return classes.split(/\s+/).includes(className)
  return false
}

function findTextElement(element: Element, text: string): Element {
  let match: Element | undefined
  visitElements(element, (child) => {
    if (!match && getTextContent(child) === text) {
      match = child
    }
  })
  assert.ok(match)
  return match
}
