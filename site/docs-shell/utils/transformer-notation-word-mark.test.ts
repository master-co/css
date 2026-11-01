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

  // One mark spans every token of the range, and each token keeps its own span inside it.
  assert.deepEqual(collectMarkedTexts(codeElement), ['hidden@sm&<=md'])
  assert.deepEqual(collectMarks(codeElement)[0].children.map(getTextContent), ['hidden', '@sm', '&', '<', '=', 'md'])
})

test('@WARN and @ERROR add a diagnostic tone to their marks', async () => {
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
  assert.deepEqual(collectMarks(codeElement).map((mark) => mark.properties?.dataTone), ['warning', 'danger'])
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

function collectMarks(element: Element): Element[] {
  const marks: Element[] = []
  visitElements(element, (child) => {
    if (child.tagName === 'mark') marks.push(child)
  })
  return marks
}

function collectMarkedTexts(element: Element): string[] {
  return collectMarks(element).map((mark) => mark.children.map(getTextContent).join(''))
}

function visitElements(element: Element, callback: (element: Element) => void) {
  callback(element)
  for (const child of element.children) {
    if (child.type === 'element') {
      visitElements(child, callback)
    }
  }
}
