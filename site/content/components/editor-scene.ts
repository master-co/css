/** The editor film's character-cell geometry, color math and deterministic scene clock. */
import type { EditorClass, EditorModel, EditorRole, EditorSceneId } from './editor-content'

/** A color decoration takes two character cells, so every column after it moves two to the right. */
export const swatchCells = 2
/** Completion rows the menu shows before it scrolls. */
export const menuRows = 8
/** The color picker's geometry in pixels; the drawn pointer aims at its parts. */
export const picker = { width: 232, header: 44, inset: 8, plane: 168, planeHeight: 120, strip: 14, gap: 10, left: 12 }
export const pickerHeight = picker.header + picker.inset * 2 + picker.planeHeight
/** The picker's box, for the stylesheet that places it and the pointer that aims inside it, as an inline style. */
export const pickerStyle = [
  `--editor-picker-width: ${picker.width}px`,
  `--editor-picker-height: ${pickerHeight}px`,
  `--editor-picker-left: ${picker.left}px`,
  `--editor-picker-inset: ${picker.inset}px`,
  `--editor-picker-plane-height: ${picker.planeHeight}px`,
  `--editor-picker-strip: ${picker.strip}px`,
  `--editor-picker-gap: ${picker.gap}px`
].join('; ')

export type HSV = [hue: number, saturation: number, value: number]

export interface Pointer {
  line: number
  /** A visual column: source columns plus the cells color swatches take. */
  column: number
  /** Extra offset in lines and pixels, to aim inside a line. */
  rows?: number
  dx?: number
  dy?: number
  /** Aim at the picker's normalized color plane or at its original-color reset swatch. */
  picker?: 'plane' | 'original'
  /** Normalized saturation and value, so the pointer follows a plane that shrinks to fit. */
  u?: number
  v?: number
  /** Follow the drag without easing. */
  instant?: boolean
}

/** Everything the stage shows at one moment of a scene. */
export interface Frame {
  caret: [line: number, column: number]
  /** The text typed at the insertion point; `accepted` once the completion replaced it. */
  typed: string
  accepted: boolean
  selecting: boolean
  /** The word typed after the completion prefix, while the menu is open. */
  menu: string | null
  pointer: Pointer | null
  pressed: boolean
  hover: number | null
  picker: boolean
  /** The literal's color while the picker edits it; `null` is the color in the source. */
  color: HSV | null
  /** A visual column to keep in view; on a narrow window the code scrolls sideways to it. */
  focus: number
}

export interface Scene {
  duration: number
  /** The revealed moment: where a chosen scene stops, and what reduced motion shows. */
  hold: number
  frame: (time: number, reset: boolean) => Frame
}

export type Geometry = ReturnType<typeof measureEditor>

/** Positions in the file: where swatches sit, what each class string spans, how long each line is. */
export function measureEditor(model: EditorModel) {
  const { insertion, classes } = model
  const inserted = classes[insertion.classIndex]
  const fullTyped = ` ${inserted.name}`
  const lineLengths = model.lines.map((spans) => spans.reduce((length, span) => length + ('text' in span ? span.text.length : span.items.reduce<number>((sum, item) => sum + (typeof item === 'string' ? item.length : classes[item].name.length), 0)), 0))
  const swatches = model.lines.map((_, line) => classes.filter((item) => item.line === line && item.swatch).map((item) => item.column + item.swatch!.at))
  const contexts = new Map<number, { line: number, start: number, end: number }>()
  for (const item of classes) {
    const range = contexts.get(item.context)
    const end = item.column + item.name.length
    if (!range) contexts.set(item.context, { line: item.line, start: item.column, end })
    else range.end = Math.max(range.end, end)
  }
  const literal = classes[model.literalClass]
  const literalHex = literal.swatch!.color
  const visual = (line: number, column: number) => column + swatchCells * swatches[line].filter((at) => at <= column).length
  return {
    fullTyped,
    lineLengths,
    literalHex,
    literalHSV: hexToHsv(literalHex),
    literalSwatch: { line: literal.line, column: visual(literal.line, literal.column + literal.swatch!.at) - swatchCells },
    visual,
    /** The column a class starts at, past its own swatch. */
    classStart: (index: number) => visual(classes[index].line, classes[index].column),
    classEnd: (index: number) => visual(classes[index].line, classes[index].column + classes[index].name.length),
    /** The class string the caret is in, which is the one that lights up. */
    contextAt(line: number, column: number, frame: Pick<Frame, 'typed' | 'accepted'>) {
      for (const [context, range] of contexts) {
        if (range.line !== line) continue
        if (column >= range.start && column <= contextEnd(context, frame)) return context
      }
      return null
    },
    contextLine: (context: number) => contexts.get(context)!.line,
    /** The visual cells a class string covers, swatches included, for the wash behind it. */
    contextSpan(context: number, frame: Pick<Frame, 'typed' | 'accepted'>) {
      const range = contexts.get(context)!
      return { line: range.line, from: visual(range.line, range.start - 1) + 1, to: visual(range.line, contextEnd(context, frame)) }
    }
  }

  function contextEnd(context: number, frame: Pick<Frame, 'typed' | 'accepted'>) {
    const range = contexts.get(context)!
    if (range.line === insertion.line && context === inserted.context && !frame.accepted) return insertion.column + frame.typed.length
    return range.end
  }
}

/** The four scenes, timed in milliseconds. Each frame is a pure function of time, so the tour can pause, resume and jump. */
export function createEditorScenes(model: EditorModel, geometry: Geometry): Record<EditorSceneId, Scene> {
  const { insertion, completion } = model
  const { fullTyped, visual } = geometry
  const trigger = ` ${completion.prefix}`
  const hover = model.classes[model.hoverClass]
  const hoverColumn = hover.column + hover.name.indexOf(':') + 3
  const hoverCenter = geometry.classStart(model.hoverClass) + hover.name.length / 2
  const swatch = geometry.literalSwatch
  const swatchCenter = swatch.column + swatchCells / 2
  // The caret steps down from the completed class to the literal's line. Arrow keys keep the column
  // they started from and clamp it to shorter lines, so text-only lines leave every class string calm.
  const walkColumn = insertion.column + 6
  const walk = Array.from({ length: swatch.line - insertion.line + 1 }, (_, index): [number, number] => {
    const line = insertion.line + index
    return [line, Math.min(walkColumn, geometry.lineLengths[line])]
  })
  const walkEnd = walk[walk.length - 1]
  const accepted = { typed: fullTyped, accepted: true, selecting: false, menu: null }
  const idle = { pointer: null, pressed: false, hover: null, picker: false, color: null }
  const handle = ([, saturation, value]: HSV): Pointer => ({
    line: swatch.line,
    column: swatch.column,
    picker: 'plane',
    u: saturation,
    v: value
  })
  const base = geometry.literalHSV
  // The drag sweeps toward a lighter tint, then down into a deeper shade of the same hue.
  const drag = (progress: number): HSV => {
    const eased = progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2
    const curve = (start: number, control: number, end: number) => (1 - eased) ** 2 * start + 2 * (1 - eased) * eased * control + eased ** 2 * end
    return [base[0], curve(base[1], 0.18, 0.9), curve(base[2], 1.08, 0.66)].map((value, index) => index ? Math.min(1, Math.max(0, value)) : value) as HSV
  }
  const caretAtWalkStart: [number, number] = [hover.line, hoverColumn]

  return {
    complete: {
      duration: 7000,
      hold: 3300,
      frame(time, reset) {
        let typed = ''
        let selecting = false
        // After a full tour the accepted class is still there: select it, then type over it.
        if (reset && time < 850) {
          typed = fullTyped
          selecting = time >= 300
        }
        const typeStart = 1000
        const step = 62
        if (time >= typeStart) typed = trigger.slice(0, Math.min(trigger.length, Math.floor((time - typeStart) / step) + 1))
        const menuAt = typeStart + trigger.length * step + 140
        if (time >= 2500) typed = trigger + completion.query.slice(0, 1)
        if (time >= 3900) typed = trigger + completion.query
        const done = time >= 5000
        const menu = time >= menuAt && !done ? typed.slice(trigger.length) : null
        return {
          ...idle,
          caret: [insertion.line, insertion.column + (done ? fullTyped.length : typed.length)],
          typed: done ? fullTyped : typed,
          accepted: done,
          selecting,
          menu,
          focus: visual(insertion.line, insertion.column + (done ? fullTyped.length : typed.length))
        }
      }
    },
    hover: {
      duration: 6000,
      hold: 2800,
      frame(time) {
        const clicked = time >= 1150
        const pointer: Pointer | null = time < 150 || time >= 5700
          ? null
          : time < 300
            ? { line: hover.line + 4, column: hoverCenter + 26, rows: 0.6, instant: true }
            : time < 5000
              ? { line: hover.line, column: hoverCenter, rows: 0.62 }
              : { line: hover.line + 4, column: hoverCenter + 30, rows: 0.6 }
        return {
          ...idle,
          ...accepted,
          caret: clicked ? [hover.line, hoverColumn] : [insertion.line, insertion.column + fullTyped.length],
          pointer,
          pressed: time >= 1000 && time < 1150,
          hover: time >= 1450 && time < 5000 ? model.hoverClass : null,
          focus: geometry.classEnd(model.hoverClass)
        }
      }
    },
    highlight: {
      duration: 300 + walk.length * 800 + 700,
      hold: 300 + 2 * 800 + 400,
      frame(time) {
        const index = Math.min(walk.length - 1, Math.floor((time - 300) / 800))
        const caret = time < 300 ? caretAtWalkStart : walk[index]
        return { ...idle, ...accepted, caret, focus: visual(caret[0], caret[1]) }
      }
    },
    color: {
      duration: 7800,
      hold: 3000,
      frame(time) {
        const dragStart = 2100
        const dragEnd = 3900
        const progress = Math.min(1, Math.max(0, (time - dragStart) / (dragEnd - dragStart)))
        const reverted = time >= 5200
        const color = time >= dragStart && !reverted ? drag(progress) : null
        const away: Pointer = { line: swatch.line + 4, column: swatchCenter + 24, rows: 0.6 }
        let pointer: Pointer | null = null
        if (time >= 150 && time < 250) pointer = { ...away, instant: true }
        else if (time >= 250 && time < 1500) pointer = { line: swatch.line, column: swatchCenter, rows: 0.55 }
        else if (time >= 1500 && time < dragStart) pointer = handle(base)
        else if (time >= dragStart && time < dragEnd) pointer = { ...handle(color!), instant: true }
        else if (time >= dragEnd && time < 4500) pointer = handle(color!)
        else if (time >= 4500 && time < 5800) pointer = { line: swatch.line, column: swatch.column, picker: 'original' }
        else if (time >= 5800 && time < 6600) pointer = away
        return {
          ...idle,
          ...accepted,
          caret: walkEnd,
          pointer,
          pressed: (time >= 950 && time < 1100) || (time >= dragStart && time < dragEnd) || (time >= 5050 && time < 5200),
          picker: time >= 1150 && time < 6100,
          color,
          // The swatch and the literal after it.
          focus: swatch.column + 10
        }
      }
    }
  }
}

/**
 * The literal class's parts with `hex` in place of its color: only the literal's own characters change,
 * so the parts around it, such as the closing `)` of `(color:#4f46e5)`, stay.
 */
export function literalParts(item: Pick<EditorClass, 'name' | 'parts' | 'swatch'>, hex: string): [string, EditorRole][] {
  const start = item.swatch!.at
  const end = start + (item.name.slice(start).match(/^#[\da-f]+/i)?.[0].length ?? 0)
  const between = (from: number, to: number) => {
    const slice: [string, EditorRole][] = []
    let offset = 0
    for (const [text, role] of item.parts) {
      const cut = [Math.max(from, offset), Math.min(to, offset + text.length)]
      if (cut[0] < cut[1]) slice.push([text.slice(cut[0] - offset, cut[1] - offset), role])
      offset += text.length
    }
    return slice
  }
  return [...between(0, start), [hex, 'number'], ...between(end, item.name.length)]
}

export function hexToHsv(hex: string): HSV {
  const [red, green, blue] = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
  const max = Math.max(red, green, blue)
  const delta = max - Math.min(red, green, blue)
  let hue = 0
  if (delta) {
    if (max === red) hue = ((green - blue) / delta) % 6
    else if (max === green) hue = (blue - red) / delta + 2
    else hue = (red - green) / delta + 4
  }
  return [(hue * 60 + 360) % 360, max ? delta / max : 0, max]
}

export function hsvToHex([hue, saturation, value]: HSV) {
  const channel = (offset: number) => {
    const k = (offset + hue / 60) % 6
    return value - value * saturation * Math.max(0, Math.min(k, 4 - k, 1))
  }
  return `#${[5, 3, 1].map((offset) => Math.round(channel(offset) * 255).toString(16).padStart(2, '0')).join('')}`
}

/** Whether white text reads better than black on a color, for the picker's label. */
export function isDark(hex: string) {
  const [red, green, blue] = [1, 3, 5].map((index) => {
    const channel = parseInt(hex.slice(index, index + 2), 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue < 0.179
}
