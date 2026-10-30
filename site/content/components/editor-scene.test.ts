import assert from 'node:assert/strict'
import { test } from 'node:test'
import { editorFeatures } from './editor-content'
import { getEditorModel } from './editor-document'
import { editorCSSParts } from './editor-syntax'
import { createEditorScenes, hexToHsv, hsvToHex, isDark, measureEditor } from './editor-scene'

const model = getEditorModel()
const geometry = measureEditor(model)
const scenes = createEditorScenes(model, geometry)

test('the scene clock always places its caret inside the text it actually renders', () => {
  for (const { id } of editorFeatures) {
    const scene = scenes[id]
    for (let time = 0; time <= scene.duration; time += 37) {
      const frame = scene.frame(time, true)
      const [line, column] = frame.caret
      const length = geometry.lineLengths[line] - (line === model.insertion.line && !frame.accepted ? geometry.fullTyped.length - frame.typed.length : 0)
      assert.ok(line >= 0 && line < model.lines.length, `${id} at ${time}`)
      assert.ok(column >= 0 && column <= length, `${id} at ${time}: ${column} / ${length}`)
      assert.ok(Number.isFinite(frame.focus) && frame.focus >= 0)
      assert.ok(frame.hover === null || model.classes[frame.hover])
      if (frame.color) {
        assert.ok(frame.color[0] >= 0 && frame.color[0] <= 360)
        assert.ok(frame.color.slice(1).every(channel => channel >= 0 && channel <= 1))
        assert.match(hsvToHex(frame.color), /^#[\da-f]{6}$/)
      }
    }
  }
})

test('the completion resets the accepted class before typing and accepts a real manifest result', () => {
  assert.equal(scenes.complete.frame(450, true).selecting, true)
  assert.equal(scenes.complete.frame(900, true).typed, '')
  const revealed = scenes.complete.frame(scenes.complete.hold, false)
  assert.equal(revealed.menu, 'm')
  const accepted = scenes.complete.frame(5400, false)
  assert.equal(accepted.accepted, true)
  assert.equal(accepted.menu, null)
  assert.equal(accepted.typed, ` ${model.completion.label}`)
})

test('every selected feature rests on the operation it explains', () => {
  assert.notEqual(scenes.complete.frame(scenes.complete.hold, false).menu, null)
  assert.equal(scenes.hover.frame(scenes.hover.hold, false).hover, model.hoverClass)
  const highlighted = scenes.highlight.frame(scenes.highlight.hold, false)
  assert.notEqual(geometry.contextAt(...highlighted.caret, highlighted), null)
  const color = scenes.color.frame(scenes.color.hold, false)
  assert.equal(color.picker, true)
  assert.equal(color.pointer?.picker, 'plane')
  assert.notEqual(color.color, null)
})

test('swatch cells shift source anchors once and keep each class range exact', () => {
  for (let index = 0; index < model.classes.length; index++) {
    const item = model.classes[index]
    const swatches = model.classes.filter(other => other.line === item.line && other.swatch && other.column + other.swatch.at <= item.column).length
    assert.equal(geometry.classStart(index), item.column + swatches * 2)
    const inside = item.swatch && item.swatch.at > 0 ? 2 : 0
    assert.equal(geometry.classEnd(index) - geometry.classStart(index), item.name.length + inside)
  }
  const typed = scenes.complete.frame(2100, false)
  const context = model.classes[model.insertion.classIndex].context
  const range = geometry.contextSpan(context, typed)
  assert.equal(range.to, geometry.visual(model.insertion.line, model.insertion.column + typed.typed.length))
})

test('picked colors round trip without drifting, including neutral colors and hue boundaries', () => {
  for (const hex of ['#000000', '#ffffff', '#808080', '#ff0000', '#00ff00', '#0000ff', '#4f46e5', '#218875', '#8079ed', '#a912ef']) {
    assert.equal(hsvToHex(hexToHsv(hex)), hex)
  }
  assert.equal(hsvToHex([360, 1, 1]), '#ff0000')
})

test('the color label chooses the higher-contrast native black or white', () => {
  for (const [hex, dark] of [['#000000', true], ['#ffffff', false], ['#4f46e5', true], ['#8079ed', false], ['#218875', false]] as const) {
    assert.equal(isDark(hex), dark, hex)
  }
})

test('syntax paint retains the exact CSS returned for every class, including whitespace', () => {
  for (const hover of model.hovers) {
    for (const line of hover.css.split('\n')) assert.equal(editorCSSParts(line).map(([text]) => text).join(''), line)
  }
  const parts = editorCSSParts('  color: oklch(46.26% .3057 266.7);')
  assert.ok(parts.some(([text, role]) => text === 'oklch' && role === 'function'))
  assert.ok(parts.some(([text, role]) => text === '46.26%' && role === 'number'))
})
