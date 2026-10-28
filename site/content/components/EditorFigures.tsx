'use client'

import { memo, useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { IconVariable } from '@tabler/icons-react'
import { useInView } from 'react-intersection-observer'
import { useMediaQuery } from 'usehooks-ts'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import { filterCompletions, type EditorClass, type EditorFeature, type EditorModel, type EditorRole, type EditorSceneId } from './editor-content'

/** A color decoration takes two character cells, so every column after it moves two to the right. */
const swatchCells = 2
/** Completion rows the menu shows before it scrolls. */
const menuRows = 8
/** The color picker's geometry in pixels; the drawn pointer aims at its parts. */
const picker = { width: 232, header: 30, inset: 8, plane: 168, planeHeight: 120, strip: 14, gap: 10, left: 12 }
const pickerHeight = picker.header + picker.inset * 2 + picker.planeHeight
/** The picker's box, for the stylesheet that places it and the pointer that aims inside it. */
const pickerStyle = {
  '--editor-picker-width': `${picker.width}px`,
  '--editor-picker-height': `${pickerHeight}px`,
  '--editor-picker-left': `${picker.left}px`
} as CSSProperties

type HSV = [hue: number, saturation: number, value: number]

interface Pointer {
  line: number
  /** A visual column: source columns plus the cells color swatches take. */
  column: number
  /** Extra offset in lines and pixels, to aim inside a line. */
  rows?: number
  dx?: number
  dy?: number
  /**
   * Aim inside the color picker opened on this cell: `dx` counts from its left edge, and `dy` from
   * its top (the header) or its bottom (the plane, which keeps its place while the header takes up
   * whatever height rounding the picker to whole lines adds).
   */
  picker?: 'top' | 'bottom'
  /** Follow the drag without easing. */
  instant?: boolean
}

/** Everything the stage shows at one moment of a scene. */
interface Frame {
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

interface Scene {
  duration: number
  /** The revealed moment: where a chosen scene stops, and what reduced motion shows. */
  hold: number
  frame: (time: number, reset: boolean) => Frame
}

export default function EditorFigures({ features, model }: { features: readonly EditorFeature[], model: EditorModel }) {
  const $ = useTranslation()
  const descriptionId = useId()
  const geometry = useMemo(() => measure(model), [model])
  const scenes = useMemo(() => createScenes(model, geometry), [model, geometry])
  const [sceneIndex, setSceneIndex] = useState(0)
  const [touring, setTouring] = useState(true)
  const [loop, setLoop] = useState(0)
  const [held, setHeld] = useState(false)
  const [frame, setFrame] = useState<Frame>(() => scenes.complete.frame(0, false))
  // The reader's own pointer: a class it rests on, and a color it picks.
  const [inside, setInside] = useState(false)
  const [inspected, setInspected] = useState<number | null>(null)
  const [readerPicker, setReaderPicker] = useState(false)
  const [readerColor, setReaderColor] = useState<HSV | null>(null)
  const elapsedRef = useRef(0)
  const frameKeyRef = useRef('')
  const rootRef = useRef<HTMLDivElement | null>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const { ref: inViewRef, inView } = useInView({ threshold: 0.3 })
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)', { initializeWithValue: false })
  const sceneId = features[sceneIndex].id
  const scene = scenes[sceneId]
  const playing = inView && !reduceMotion && (!touring || !held)

  const setRoot = useCallback((node: HTMLDivElement | null) => {
    rootRef.current = node
    inViewRef(node)
  }, [inViewRef])

  const show = useCallback((next: Frame) => {
    const key = JSON.stringify(next)
    if (key === frameKeyRef.current) return
    frameKeyRef.current = key
    setFrame(next)
  }, [])

  const setProgress = (value: number) => rootRef.current?.style.setProperty('--editor-progress', value.toFixed(4))

  // Reduced motion shows each scene's revealed moment, without a tour.
  useEffect(() => {
    if (!reduceMotion) return
    show(scene.frame(scene.hold, false))
    setProgress(1)
  }, [reduceMotion, scene, show])

  useEffect(() => {
    if (!playing) return
    let frameId = 0
    let last = 0
    const tick = (time: number) => {
      if (last) elapsedRef.current += Math.min(time - last, 100)
      last = time
      const elapsed = elapsedRef.current
      if (!touring && elapsed >= scene.hold) {
        show(scene.frame(scene.hold, false))
        setProgress(1)
        return
      }
      if (elapsed >= scene.duration) {
        elapsedRef.current = 0
        const next = (sceneIndex + 1) % features.length
        if (next === 0) setLoop((value) => value + 1)
        setReaderColor(null)
        setSceneIndex(next)
        return
      }
      show(scene.frame(elapsed, touring && sceneIndex === 0 && loop > 0))
      setProgress(touring ? elapsed / scene.duration : 1)
      frameId = requestAnimationFrame(tick)
    }
    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [features.length, loop, playing, scene, sceneIndex, show, touring])

  const choose = (index: number) => {
    elapsedRef.current = 0
    setTouring(false)
    setReaderColor(null)
    setSceneIndex(index)
    setProgress(0)
  }

  const inspect = useCallback((index: number | null) => {
    clearTimeout(leaveTimer.current)
    if (index === null) leaveTimer.current = setTimeout(() => setInspected(null), 90)
    else setInspected(index)
  }, [])

  const openPicker = useCallback(() => {
    setReaderPicker(true)
    setInspected(null)
  }, [])

  // The reader's pointer stands in for the drawn one: what it rests on wins over the scene.
  // Resting inside the window but off the classes holds whatever the scene revealed.
  const hoverIndex = inside && inspected !== null ? inspected : frame.hover
  const pickerOpen = readerPicker || (frame.picker && hoverIndex === null)
  const menuOpen = frame.menu !== null && hoverIndex === null
  const literal = readerColor ?? frame.color
  const literalHex = literal ? hsvToHex(literal) : geometry.literalHex
  const caretLine = frame.caret[0]
  const caretColumn = geometry.visual(caretLine, frame.caret[1])
  // Like an editor, the caret holds still while it moves and starts blinking once it rests.
  const [moving, setMoving] = useState(false)
  useEffect(() => {
    setMoving(true)
    const timer = setTimeout(() => setMoving(false), 520)
    return () => clearTimeout(timer)
  }, [caretLine, caretColumn])
  const litContext = inside && inspected !== null ? model.classes[inspected].context : geometry.contextAt(frame.caret[0], frame.caret[1], frame)

  const bodyStyle = {
    '--editor-lines': model.lines.length,
    '--editor-caret-line': caretLine,
    '--editor-caret-column': caretColumn,
    '--editor-focus-column': frame.focus
  } as CSSProperties

  return (
    <div
      ref={setRoot}
      className="home-editor-stage"
      data-scene={sceneId}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHeld(false)
      }}
      onFocus={() => setHeld(true)}
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}>
      <div className="home-editor-frame home-marks">
        <div
          aria-hidden="true"
          className="home-editor-window"
          onPointerEnter={() => setInside(true)}
          onPointerLeave={() => {
            setInside(false)
            setInspected(null)
            setReaderPicker(false)
          }}>
          <div className="home-editor-bar">
            <span className="home-editor-dots"><span /><span /><span /></span>
            <span className="home-editor-tab">{model.fileName}</span>
            <span className="home-editor-status">{$('Ln {line}, Col {column}').replace('{line}', String(caretLine + 1)).replace('{column}', String(frame.caret[1] + 1))}</span>
          </div>
          <div className="home-editor-body" data-pane={hoverIndex !== null || menuOpen || pickerOpen ? '' : undefined} style={bodyStyle}>
            <div className="home-editor-gutter">
              {model.lines.map((_, index) => <span key={index} data-current={index === caretLine ? '' : undefined}>{index + 1}</span>)}
            </div>
            <div className="home-editor-viewport">
              <span className="home-editor-current-line" />
              <div className="home-editor-plane">
                {model.lines.map((spans, line) => (
                  <EditorLine
                    key={line}
                    // Each line only receives what it shows, so a picker drag or a typed key re-renders one line.
                    accepted={line === model.insertion.line && frame.accepted}
                    inspect={inspect}
                    line={line}
                    litContext={litContext !== null && geometry.contextLine(litContext) === line ? litContext : null}
                    literalHex={line === model.classes[model.literalClass].line ? literalHex : ''}
                    model={model}
                    openPicker={openPicker}
                    spans={spans}
                    typed={line === model.insertion.line ? frame.typed : ''}
                  />
                ))}
                {frame.selecting && <span className="home-editor-selection" style={{ '--editor-anchor-line': model.insertion.line, '--editor-from': geometry.visual(model.insertion.line, model.insertion.column), '--editor-to': geometry.visual(model.insertion.line, model.insertion.column + frame.typed.length) } as CSSProperties} />}
                <ContextWash span={litContext === null ? null : geometry.contextSpan(litContext, frame)} />
                {hoverIndex !== null && <span className="home-editor-hover-range" style={rangeStyle(geometry, model.classes[hoverIndex])} />}
                <span className="home-editor-caret" data-moving={moving ? '' : undefined} />
              </div>
            </div>
            <div className="home-editor-overlays" style={pickerStyle}>
              <HoverCard decode={!reduceMotion} geometry={geometry} index={hoverIndex} model={model} />
              <SuggestWidget geometry={geometry} model={model} open={menuOpen} query={frame.menu} />
              <ColorPicker
                anchor={geometry.literalSwatch}
                color={literal ?? geometry.literalHSV}
                open={pickerOpen}
                original={geometry.literalHex}
                pick={(color) => setReaderColor(color)}
              />
              <DrawnPointer pointer={inside ? null : frame.pointer} pressed={frame.pressed} />
            </div>
          </div>
        </div>
      </div>
      <div className="home-editor-chapters" role="group" aria-label={$('Language service features')}>
        {features.map((feature, index) => (
          <button
            key={feature.id}
            aria-describedby={`${descriptionId}-${index}`}
            aria-pressed={index === sceneIndex}
            className="home-editor-chapter"
            data-done={touring && index < sceneIndex ? '' : undefined}
            data-touring={touring ? '' : undefined}
            onClick={() => choose(index)}
            type="button">
            <span aria-hidden="true" className="home-editor-chapter-track"><span className="home-editor-chapter-progress" /></span>
            <span className="home-editor-chapter-title">{$(feature.title)}</span>
            <span className="home-editor-chapter-body" id={`${descriptionId}-${index}`}>{$(feature.body)}</span>
          </button>
        ))}
      </div>
      <div aria-hidden="true" className="home-editor-caption">
        {features.map((feature, index) => (
          <div key={feature.id} className="home-editor-caption-item" data-active={index === sceneIndex ? '' : undefined}>
            <p className="home-editor-caption-title">{$(feature.title)}</p>
            <p className="home-editor-caption-body">{$(feature.body)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

type Geometry = ReturnType<typeof measure>

/** Positions in the file: where swatches sit, what each class string spans, how long each line is. */
function measure(model: EditorModel) {
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
    classEnd: (index: number) => visual(classes[index].line, classes[index].column) + classes[index].name.length,
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
function createScenes(model: EditorModel, geometry: Geometry): Record<EditorSceneId, Scene> {
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
    picker: 'bottom',
    dx: picker.inset + saturation * picker.plane,
    dy: -(picker.inset + value * picker.planeHeight)
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
        else if (time >= 4500 && time < 5800) pointer = { line: swatch.line, column: swatch.column, picker: 'top', dx: picker.width - 22, dy: picker.header / 2 }
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

/** One line of markup. Class strings light up when the caret is inside them; every class is a hover target. */
const EditorLine = memo(function EditorLine({ accepted, inspect, line, litContext, literalHex, model, openPicker, spans, typed }: {
  accepted: boolean
  inspect: (index: number | null) => void
  line: number
  litContext: number | null
  literalHex: string
  model: EditorModel
  openPicker: () => void
  spans: EditorModel['lines'][number]
  typed: string
}) {
  const { insertion } = model
  const lit = spans.some((span) => 'context' in span && span.context === litContext)
  return (
    <div className="home-editor-line" data-lit={lit ? '' : undefined}>
      {spans.map((span, index) => {
        if ('text' in span) return <span key={index} data-tone={span.tone}>{span.text}</span>
        const insertAt = line === insertion.line ? span.items.indexOf(insertion.classIndex) : -1
        const items: ReactNode[] = []
        span.items.forEach((item, position) => {
          if (insertAt >= 0 && (position === insertAt - 1 || position === insertAt)) {
            if (position === insertAt && typed) {
              items.push(accepted
                ? <span key="typed">{' '}<ClassToken index={item as number} inspect={inspect} literalHex={literalHex} model={model} openPicker={openPicker} /></span>
                : <span key="typed" className="home-editor-typed">{typed}</span>)
            }
            return
          }
          items.push(typeof item === 'string'
            ? item
            : <ClassToken key={position} index={item} inspect={inspect} literalHex={literalHex} model={model} openPicker={openPicker} />)
        })
        return <span key={index} className="home-editor-classes" data-lit={span.context === litContext ? '' : undefined}>{items}</span>
      })}
    </div>
  )
})

function ClassToken({ index, inspect, literalHex, model, openPicker }: {
  index: number
  inspect: (index: number | null) => void
  literalHex: string
  model: EditorModel
  openPicker: () => void
}) {
  const item = model.classes[index]
  const isLiteral = index === model.literalClass
  const parts: [string, EditorRole][] = isLiteral
    ? [...item.parts.slice(0, item.swatch!.at === 0 ? 0 : item.parts.findIndex(([text]) => text === ':') + 1), ['#', 'base'], [literalHex.slice(1), 'number']]
    : item.parts
  const children: ReactNode[] = []
  let offset = 0
  parts.forEach(([text, role], position) => {
    if (item.swatch && offset === item.swatch.at) children.push(<Swatch key="swatch" color={isLiteral ? literalHex : item.swatch.color} onClick={isLiteral ? openPicker : undefined} />)
    children.push(<span key={position} data-role={role}>{text}</span>)
    offset += text.length
  })
  return (
    <span className="home-editor-class" onPointerEnter={() => inspect(index)} onPointerLeave={() => inspect(null)}>
      {children}
    </span>
  )
}

function Swatch({ color, onClick }: { color: string, onClick?: () => void }) {
  // The figure is decorative: the pointer can open the picker, the chapter buttons carry the keyboard path.
  return <span className="home-editor-swatch" data-editable={onClick ? '' : undefined} onPointerDown={onClick} style={{ '--editor-swatch': color } as CSSProperties} />
}

/** A soft wash behind the class string that is lit, gliding from string to string with the caret. */
function ContextWash({ span }: { span: { line: number, from: number, to: number } | null }) {
  const { line, from, to } = useLast(span, { line: 0, from: 0, to: 0 })
  return <span className="home-editor-context" data-visible={span ? '' : undefined} style={{ '--editor-anchor-line': line, '--editor-from': from, '--editor-to': to } as CSSProperties} />
}

function rangeStyle(geometry: Geometry, item: EditorClass) {
  const start = geometry.visual(item.line, item.column)
  return { '--editor-anchor-line': item.line, '--editor-from': start, '--editor-to': start + item.name.length } as CSSProperties
}

/** Where an overlay sits: its anchor line and visual column, as CSS variables the stylesheet places by. */
function anchorStyle(line: number, column: number, extra?: Record<string, string | number>) {
  return { '--editor-anchor-line': line, '--editor-anchor-column': column, ...extra } as CSSProperties
}

/** The language service's hover: the tokens a class uses, then the CSS it generates, in layers. */
function HoverCard({ decode, geometry, index, model }: { decode: boolean, geometry: Geometry, index: number | null, model: EditorModel }) {
  // The last card stays mounted so it can fold away instead of vanishing.
  const shown = useLast(index, model.hoverClass)
  const item = model.classes[shown]
  const hover = model.hovers[item.hover]
  const above = item.line > model.lines.length / 2
  const lines = hover.css.split('\n')
  // The rule decodes in from the class matrix's glyphs, left to right, a line at a time.
  // Progress belongs to the class it decodes, so a newly shown class starts from glyphs on its first paint.
  const [run, setRun] = useState({ index: shown, progress: 1 })
  const progress = run.index === shown ? run.progress : decode && index !== null ? 0 : 1
  const openRef = useRef(false)
  useEffect(() => {
    const opening = !openRef.current
    openRef.current = index !== null
    if (index === null || !decode) return
    const duration = opening ? 520 : 260
    const start = performance.now()
    let frame = 0
    const step = (now: number) => {
      const value = Math.min(1, (now - start) / duration)
      setRun({ index, progress: value })
      if (value < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [decode, index])
  const longest = Math.max(...lines.map((line) => line.length))
  const reach = progress * (longest + decodeBand + decodeStagger * lines.length)
  return (
    <div
      className="home-editor-hover-card home-editor-pane"
      data-above={above ? '' : undefined}
      data-open={index !== null ? '' : undefined}
      style={anchorStyle(item.line, geometry.classStart(shown), {
        // The card's height is counted in lines, so its edges fall between lines of code, never through them.
        '--editor-card-lines': lines.length,
        '--editor-card-tokens': hover.tokens.length ? 1 : 0,
        '--editor-room-rows': above ? item.line : model.lines.length - item.line - 1
      })}>
      <div className="home-editor-hover-content">
        {hover.tokens.length > 0 && (
          <p className="home-editor-hover-tokens">
            Named token: {hover.tokens.map((token) => <code key={token}>{token}</code>)}
          </p>
        )}
        <pre className="home-editor-hover-css">
          {lines.map((line, position) => <DecodedLine key={position} line={line} reach={progress < 1 ? reach - position * decodeStagger : Infinity} seed={position + Math.floor(progress * 24)} />)}
        </pre>
      </div>
    </div>
  )
}

const decodeBand = 7
const decodeStagger = 2.5
const decodeGlyphs = 'abcdefghijklmnopqrstuvwxyz0123456789-:@()|/.'

/** One line of CSS: decoded up to `reach`, a short band of matrix glyphs after it, nothing beyond. */
function DecodedLine({ line, reach, seed }: { line: string, reach: number, seed: number }) {
  const shown = Math.max(0, Math.min(line.length, Math.floor(reach)))
  const glyphs = [...line.slice(shown, Math.max(shown, Math.min(line.length, Math.floor(reach + decodeBand))))]
    .map((character, offset) => /\s/.test(character) ? character : decodeGlyphs[(seed * 7 + (shown + offset) * 13) % decodeGlyphs.length])
    .join('')
  let offset = 0
  return (
    <span className="home-editor-css-line">
      {cssParts(line).map(([text, role], part) => {
        const visible = text.slice(0, Math.max(0, shown - offset))
        offset += text.length
        return visible && <span key={part} data-role={role}>{visible}</span>
      })}
      {glyphs && <span className="home-editor-decoding">{glyphs}</span>}
    </span>
  )
}

/** The completion menu, narrowed by the typed word, with the focused item's detail beside it. */
function SuggestWidget({ geometry, model, open, query }: { geometry: Geometry, model: EditorModel, open: boolean, query: string | null }) {
  const { completion, insertion } = model
  const word = useLast(query, '')
  const items = useMemo(() => filterCompletions(completion.labels, completion.prefix, word), [completion, word])
  const focused = items[0]
  const detail = focused?.label === completion.label ? completion.detail : undefined
  // The detail reads `(token --name) scope: value`; the docs pane sets each part on its own line.
  const token = detail?.slice(0, detail.indexOf(')') + 1)
  const definition = detail?.slice(detail.indexOf(')') + 2)
  const scope = definition?.slice(0, definition.indexOf(': '))
  const value = definition?.slice(definition.indexOf(': ') + 2)
  return (
    <div
      className="home-editor-suggest"
      data-open={open ? '' : undefined}
      style={anchorStyle(insertion.line, geometry.visual(insertion.line, insertion.column + 1), { '--editor-suggest-rows': Math.min(menuRows, items.length) })}>
      <div className="home-editor-pane home-editor-suggest-list">
        {items.slice(0, menuRows).map((item, index) => (
          <div key={item.label} className="home-editor-suggest-item" data-focused={index === 0 ? '' : undefined}>
            <IconVariable aria-hidden="true" className="home-editor-suggest-icon" size={14} stroke={1.75} />
            <span className="home-editor-suggest-label">
              {[...item.label].map((character, position) => item.matches.includes(position) ? <b key={position}>{character}</b> : character)}
            </span>
            {index === 0 && token && <span className="home-editor-suggest-detail">{token}</span>}
          </div>
        ))}
        {items.length > menuRows && <span className="home-editor-suggest-scroll" style={{ '--editor-suggest-thumb': menuRows / items.length } as CSSProperties} />}
      </div>
      <div className="home-editor-pane home-editor-suggest-docs" data-open={open && detail ? '' : undefined}>
        <p className="home-editor-suggest-docs-token">{token}</p>
        <p className="home-editor-suggest-docs-scope">{scope}:</p>
        {/* Break the value only after its commas, never inside a custom property name. */}
        <p className="home-editor-suggest-docs-value">{value?.split(/(?<=,) /).map((part, index) => <span key={index}>{index ? ' ' : ''}<span className="home-editor-nowrap">{part}</span></span>)}</p>
      </div>
    </div>
  )
}

/** The editor's color picker on the literal: the new color, the original to revert to, a plane and two strips. */
function ColorPicker({ anchor, color, open, original, pick }: {
  anchor: { line: number, column: number }
  color: HSV
  open: boolean
  original: string
  pick: (color: HSV) => void
}) {
  const hex = hsvToHex(color)
  const [hue, saturation, value] = color
  const drag = (event: ReactPointerEvent<HTMLElement>, apply: (x: number, y: number) => void) => {
    const target = event.currentTarget
    const update = (clientX: number, clientY: number) => {
      const rect = target.getBoundingClientRect()
      apply(Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)), Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)))
    }
    target.setPointerCapture(event.pointerId)
    update(event.clientX, event.clientY)
    const move = (moveEvent: PointerEvent) => update(moveEvent.clientX, moveEvent.clientY)
    const up = () => {
      target.removeEventListener('pointermove', move)
      target.removeEventListener('pointerup', up)
    }
    target.addEventListener('pointermove', move)
    target.addEventListener('pointerup', up)
  }
  return (
    <div
      className="home-editor-pane home-editor-picker"
      data-open={open ? '' : undefined}
      style={anchorStyle(anchor.line, anchor.column, { '--editor-picker-hue': hue })}>
      <div className="home-editor-picker-header" style={{ minHeight: picker.header }}>
        <span className="home-editor-picker-new" data-dark={isDark(hex) ? '' : undefined} style={{ backgroundColor: hex }}>{hex}</span>
        <span className="home-editor-picker-original" onPointerDown={() => pick(hexToHsv(original))} style={{ backgroundColor: original }} />
      </div>
      <div className="home-editor-picker-body" style={{ padding: picker.inset, gap: picker.gap }}>
        <span
          className="home-editor-picker-plane"
          onPointerDown={(event) => drag(event, (x, y) => pick([hue, x, 1 - y]))}
          style={{ width: picker.plane, height: picker.planeHeight }}>
          <span className="home-editor-picker-handle" style={{ left: `${saturation * 100}%`, top: `${(1 - value) * 100}%`, backgroundColor: hex }} />
        </span>
        <span className="home-editor-picker-hue home-editor-picker-strip" onPointerDown={(event) => drag(event, (_, y) => pick([y * 360, saturation, value]))} style={{ width: picker.strip }}>
          <span style={{ top: `${(hue / 360) * 100}%` }} />
        </span>
        <span className="home-editor-picker-alpha home-editor-picker-strip" style={{ width: picker.strip, '--editor-picker-color': hex } as CSSProperties}>
          <span style={{ top: 0 }} />
        </span>
      </div>
    </div>
  )
}

/** The demo's own pointer; hidden while the reader's pointer is in the window. */
function DrawnPointer({ pointer, pressed }: { pointer: Pointer | null, pressed: boolean }) {
  const { line, column, rows = 0, dx = 0, dy = 0, instant, picker: inPicker } = useLast(pointer, { line: 0, column: 0 })
  return (
    <svg
      className="home-editor-pointer"
      data-instant={instant ? '' : undefined}
      data-picker={inPicker}
      data-pressed={pressed ? '' : undefined}
      data-visible={pointer ? '' : undefined}
      height="20"
      style={anchorStyle(line, column, { '--editor-pointer-rows': rows, '--editor-pointer-dx': `${dx}px`, '--editor-pointer-dy': `${dy}px` })}
      viewBox="0 0 20 20"
      width="20">
      <path d="M4 2.5v13.2l3.4-3.2 2.3 5.2 2.4-1-2.3-5.1h4.7z" />
    </svg>
  )
}

/** The value, or the last one that was not `null`, so a closing overlay keeps its content while it folds away. */
function useLast<T>(value: T | null, initial: T): T {
  const [last, setLast] = useState<T>(value ?? initial)
  if (value !== null && value !== last) setLast(value)
  return value ?? last
}

/** Color a line of the hover CSS by the same roles the class string uses, so each part of a class finds its CSS. */
function cssParts(line: string): [string, EditorRole][] {
  const [, indent, body] = line.match(/^(\s*)(.*)$/)!
  if (body.startsWith('@')) {
    const [, keyword, rest] = body.match(/^(@[\w-]+)(.*?)\s*\{?$/)!
    return [[indent, 'base'], [keyword, 'query'], [rest, keyword === '@layer' ? 'utility' : 'query'], [' {', 'punct']]
  }
  if (body.endsWith('{') || body.endsWith(',')) return [[indent, 'base'], [body.replace(/\s*\{$/, ''), 'selector'], [body.endsWith('{') ? ' {' : '', 'punct']]
  if (body === '}') return [[indent, 'base'], ['}', 'punct']]
  const declaration = body.match(/^([\w-]+)(:\s*)(.*?)(;?)$/)
  if (declaration) return [[indent, 'base'], [declaration[1], 'property'], [declaration[2], 'punct'], [declaration[3], 'utility'], [declaration[4], 'punct']]
  return [[line, 'base']]
}

function hexToHsv(hex: string): HSV {
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

function hsvToHex([hue, saturation, value]: HSV) {
  const channel = (offset: number) => {
    const k = (offset + hue / 60) % 6
    return value - value * saturation * Math.max(0, Math.min(k, 4 - k, 1))
  }
  return `#${[5, 3, 1].map((offset) => Math.round(channel(offset) * 255).toString(16).padStart(2, '0')).join('')}`
}

/** Whether white text reads better than black on a color, for the picker's label. */
function isDark(hex: string) {
  const [red, green, blue] = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue < 0.5
}
