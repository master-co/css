'use client'

import { memo, useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { IconColorPicker, IconFileCode, IconPlayerPauseFilled, IconPlayerPlayFilled, IconVariable, IconX } from '@tabler/icons-react'
import { useInView } from 'react-intersection-observer'
import { useMediaQuery } from 'usehooks-ts'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import { HomeEditorBar, HomeEditorLights, HomeEditorTab, HomeEditorWindow } from './HomeEditorWindow'
import { createEditorScenes, hexToHsv, hsvToHex, isDark, measureEditor, menuRows, picker, pickerStyle, type Frame, type Geometry, type HSV, type Pointer } from './editor-scene'
import { editorCSSParts } from './editor-syntax'
import { filterCompletions, type EditorClass, type EditorFeature, type EditorModel, type EditorRole } from './editor-content'

export default function EditorFigures({ features, icons, model }: { features: readonly EditorFeature[], icons: ReactNode[], model: EditorModel }) {
  const $ = useTranslation()
  const descriptionId = useId()
  const geometry = useMemo(() => measureEditor(model), [model])
  const scenes = useMemo(() => createEditorScenes(model, geometry), [model, geometry])
  const [sceneIndex, setSceneIndex] = useState(0)
  const [touring, setTouring] = useState(true)
  const [paused, setPaused] = useState(false)
  const [finished, setFinished] = useState(false)
  const [loop, setLoop] = useState(0)
  const [pointerHeld, setPointerHeld] = useState(false)
  const [focusHeld, setFocusHeld] = useState(false)
  const [codeFocused, setCodeFocused] = useState(false)
  const [visible, setVisible] = useState(true)
  const [viewportWidth, setViewportWidth] = useState(0)
  const [frame, setFrame] = useState<Frame>(() => scenes.complete.frame(0, false))
  // The reader's own pointer: a class it rests on, and a color it picks.
  const [inside, setInside] = useState(false)
  const [inspected, setInspected] = useState<number | null>(null)
  const [touchInspected, setTouchInspected] = useState<number | null>(null)
  const [readerPicker, setReaderPicker] = useState(false)
  const [readerColor, setReaderColor] = useState<HSV | null>(null)
  const elapsedRef = useRef(0)
  const frameKeyRef = useRef('')
  const rootRef = useRef<HTMLDivElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const touchStart = useRef<{ index: number, x: number, y: number } | null>(null)
  const progressRefs = useRef<(HTMLSpanElement | null)[]>([])
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const { ref: inViewRef, inView } = useInView({ threshold: 0.3 })
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)', { initializeWithValue: false })
  const sceneId = features[sceneIndex].id
  const scene = scenes[sceneId]
  const playing = inView && visible && !paused && !finished && !reduceMotion && !inside && !codeFocused && !readerPicker && (!touring || (!pointerHeld && !focusHeld))

  useEffect(() => {
    const visibility = () => setVisible(!document.hidden)
    visibility()
    document.addEventListener('visibilitychange', visibility)
    // A pointer or focus can already be here when the island hydrates.
    setPointerHeld(!!rootRef.current?.matches(':hover') && !rootRef.current.querySelector('.home-editor-playback:hover'))
    setFocusHeld(!!rootRef.current?.contains(document.activeElement) && !document.activeElement?.closest('.home-editor-playback'))
    return () => {
      document.removeEventListener('visibilitychange', visibility)
      clearTimeout(leaveTimer.current)
    }
  }, [])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => setViewportWidth(entry.contentRect.width))
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [])

  const show = useCallback((next: Frame) => {
    const key = JSON.stringify(next)
    if (key === frameKeyRef.current) return
    frameKeyRef.current = key
    setFrame(next)
  }, [])

  // Only the tiny progress leaf changes every frame; the code and illustrations stay untouched.
  const setProgress = useCallback((value: number, index = sceneIndex) => {
    progressRefs.current[index]?.style.setProperty('--editor-progress', value.toFixed(4))
  }, [sceneIndex])

  // Reduced motion shows each scene's revealed moment, without a tour.
  useEffect(() => {
    if (!reduceMotion) return
    elapsedRef.current = scene.hold
    show(scene.frame(scene.hold, false))
    setProgress(1)
  }, [reduceMotion, scene, setProgress, show])

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
        setFinished(true)
        return
      }
      if (elapsed >= scene.duration) {
        elapsedRef.current = 0
        const next = (sceneIndex + 1) % features.length
        setProgress(0, next)
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
  }, [features.length, loop, playing, scene, sceneIndex, setProgress, show, touring])

  const choose = (index: number) => {
    elapsedRef.current = 0
    setTouring(false)
    setPaused(false)
    setFinished(false)
    setReaderPicker(false)
    setInspected(null)
    setTouchInspected(null)
    setReaderColor(null)
    setSceneIndex(index)
    setLoop((value) => value + 1)
    show(scenes[features[index].id].frame(reduceMotion ? scenes[features[index].id].hold : 0, false))
    setProgress(reduceMotion ? 1 : 0, index)
  }

  const togglePlayback = () => {
    setTouchInspected(null)
    if (touring && !paused) {
      setPaused(true)
      return
    }
    if (!touring) elapsedRef.current = 0
    setTouring(true)
    setPaused(false)
    setFinished(false)
  }

  const inspect = useCallback((index: number | null) => {
    clearTimeout(leaveTimer.current)
    if (index !== null) {
      setInspected(index)
      return
    }
    const reading = () => rootRef.current?.querySelector('.home-editor-hover-card')?.contains(document.activeElement)
    if (!reading()) leaveTimer.current = setTimeout(() => { if (!reading()) setInspected(null) }, 90)
  }, [])

  const openPicker = useCallback(() => {
    setTouring(false)
    setPaused(true)
    setReaderPicker(true)
    setInspected(null)
    setTouchInspected(null)
  }, [])

  const closePicker = useCallback((restoreFocus = true) => {
    setTouring(false)
    setPaused(true)
    setReaderPicker(false)
    show({ ...frame, picker: false })
    if (restoreFocus) rootRef.current?.querySelector<HTMLButtonElement>('.home-editor-swatch[data-editable]')?.focus({ preventScroll: true })
  }, [frame, show])

  useEffect(() => {
    if (!readerPicker) return
    rootRef.current?.querySelector<HTMLInputElement>('.home-editor-picker input')?.focus({ preventScroll: true })
    const outside = (event: PointerEvent) => {
      if (!rootRef.current?.querySelector('.home-editor-body')?.contains(event.target as Node)) closePicker(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [closePicker, readerPicker])

  useEffect(() => {
    if (touchInspected === null) return
    const outside = (event: PointerEvent) => {
      if (rootRef.current?.querySelector('.home-editor-body')?.contains(event.target as Node)) return
      setTouchInspected(null)
      setInspected(null)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [touchInspected])

  // The reader's pointer stands in for the drawn one: what it rests on wins over the scene.
  // Resting inside the window but off the classes holds whatever the scene revealed.
  const readerInspection = touchInspected ?? (inside || codeFocused ? inspected : null)
  const hoverIndex = readerPicker ? null : readerInspection ?? frame.hover
  const pickerOpen = readerPicker || (frame.picker && hoverIndex === null)
  const menuOpen = !readerPicker && frame.menu !== null && hoverIndex === null
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
  const litContext = readerInspection !== null ? model.classes[readerInspection].context : geometry.contextAt(frame.caret[0], frame.caret[1], frame)

  // Native horizontal scrolling lets the reader explore the whole file. The tour only moves it
  // far enough to keep its current word clear of the faded edge; reading always takes priority.
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || !inView || inside || codeFocused || readerPicker || paused) return
    const cell = parseFloat(getComputedStyle(viewport).getPropertyValue('--editor-ch'))
    const padding = parseFloat(getComputedStyle(viewport.querySelector('.home-editor-plane')!).paddingLeft)
    const column = padding + frame.focus * cell
    const shoulder = Math.min(viewport.clientWidth / 3, cell * 7)
    const left = column > viewport.scrollLeft + viewport.clientWidth - shoulder
      ? column - viewport.clientWidth + shoulder
      : column < viewport.scrollLeft + shoulder ? Math.max(0, column - shoulder) : viewport.scrollLeft
    viewport.scrollTo({ left, behavior: reduceMotion ? 'instant' : 'smooth' })
  }, [codeFocused, frame.focus, inView, inside, paused, readerPicker, reduceMotion, viewportWidth])

  const read = () => {
    setTouring(false)
    setPaused(true)
  }

  const scrollCode = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    read()
    const viewport = event.currentTarget
    const cell = parseFloat(getComputedStyle(viewport).getPropertyValue('--editor-ch'))
    if (event.key === 'Home' || event.key === 'End') viewport.scrollTo({ left: event.key === 'Home' ? 0 : viewport.scrollWidth, behavior: 'instant' })
    else viewport.scrollBy({ left: (event.key === 'ArrowRight' ? 1 : -1) * cell * 6, behavior: 'instant' })
  }

  const bodyStyle = {
    '--editor-lines': model.lines.length,
    '--editor-caret-line': caretLine,
    '--editor-caret-column': caretColumn
  } as CSSProperties

  return (
    <div
      ref={rootRef}
      className="home-editor-stage"
      data-running={playing ? '' : undefined}
      data-scene={sceneId}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocusHeld(false)
      }}
      onFocus={(event) => setFocusHeld(!event.target.closest('.home-editor-playback'))}
      onPointerOver={(event) => { if (event.pointerType !== 'touch') setPointerHeld(!(event.target as Element).closest('.home-editor-playback')) }}
      onPointerLeave={() => setPointerHeld(false)}>
      <div className="home-editor-chapters" role="group" aria-label={$('Language service features')}>
        {features.map((feature, index) => (
          <button
            key={feature.id}
            aria-label={$(feature.title)}
            aria-describedby={`${descriptionId}-${index}`}
            aria-pressed={index === sceneIndex}
            className="home-editor-chapter"
            data-touring={touring && !reduceMotion ? '' : undefined}
            onClick={() => choose(index)}
            type="button">
            <span aria-hidden="true" className="home-editor-chapter-track"><span className="home-editor-chapter-progress" ref={(element) => { progressRefs.current[index] = element }} /></span>
            {icons[index]}
            <span className="home-editor-chapter-title">{$(feature.title)}</span>
            <span className="home-editor-chapter-body" id={`${descriptionId}-${index}`}>{$(feature.body)}</span>
          </button>
        ))}
        {/* Two columns cannot hang a body under each title without holes, so they share one line below. */}
        <div aria-hidden="true" className="home-editor-chapter-note">
          {features.map((feature, index) => <p data-active={index === sceneIndex || undefined} key={feature.id}>{$(feature.body)}</p>)}
        </div>
      </div>
      <p className="sr-only" id={`${descriptionId}-scroll`}>{$('Use the arrow keys or scroll horizontally to read the file.')}</p>
      <div ref={inViewRef} className="home-editor-frame home-marks">
        <HomeEditorWindow>
          <HomeEditorBar aria-hidden="true">
            <HomeEditorLights />
            <HomeEditorTab><IconFileCode size={14} stroke={1.75} /><span className="home-editor-file-name">{model.fileName}</span></HomeEditorTab>
            <span className="home-editor-status">{$('Ln {line}, Col {column}').replace('{line}', String(caretLine + 1)).replace('{column}', String(frame.caret[1] + 1))}</span>
          </HomeEditorBar>
          <div
            className="home-editor-body"
            data-pane={hoverIndex !== null || menuOpen || pickerOpen ? '' : undefined}
            onPointerDown={(event) => {
              read()
              const target = event.target as Element
              if (!target.closest('.home-editor-hover-card, .home-editor-picker')) setTouchInspected(null)
              const token = target.closest<HTMLElement>('[data-editor-class]')
              touchStart.current = event.pointerType === 'touch' && token ? { index: Number(token.dataset.editorClass), x: event.clientX, y: event.clientY } : null
            }}
            onPointerUp={(event) => {
              const start = touchStart.current
              touchStart.current = null
              if (start && event.pointerType === 'touch' && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 8) setTouchInspected(start.index)
            }}
            onPointerCancel={() => { touchStart.current = null }}
            onPointerEnter={(event) => { if (event.pointerType !== 'touch') setInside(true) }}
            onPointerLeave={(event) => {
              setInside(false)
              if (!event.currentTarget.contains(document.activeElement)) setInspected(null)
            }}
            onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setCodeFocused(false) }}
            onFocus={() => setCodeFocused(true)}
            style={bodyStyle}>
            <div aria-hidden="true" className="home-editor-gutter">
              {model.lines.map((_, index) => <span key={index} data-current={index === caretLine ? '' : undefined}>{index + 1}</span>)}
            </div>
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions -- A read-only code viewport needs a keyboard entry point and horizontal navigation. */}
            <div onKeyDown={scrollCode} tabIndex={0}
              ref={viewportRef}
              aria-describedby={`${descriptionId}-scroll`}
              aria-label={$('Scrollable code example')}
              className="home-editor-viewport"
              onFocus={read}
              onScroll={(event) => event.currentTarget.parentElement?.style.setProperty('--editor-shift', `${-event.currentTarget.scrollLeft}px`)}
              onWheel={(event) => { if (event.deltaX || event.shiftKey) read() }}
              role="region">
              <div className="home-editor-plane">
                <span aria-hidden="true" className="home-editor-current-line" />
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
                <span aria-hidden="true" className="home-editor-caret" data-moving={moving ? '' : undefined} />
              </div>
            </div>
            <div className="home-editor-overlays" style={pickerStyle}>
              <HoverCard animate={!reduceMotion && visible && inView} geometry={geometry} index={hoverIndex} inspect={inspect} literalHex={literalHex} model={model} />
              <SuggestWidget geometry={geometry} model={model} open={menuOpen} query={frame.menu} />
              <ColorPicker
                anchor={geometry.literalSwatch}
                color={literal ?? geometry.literalHSV}
                close={closePicker}
                open={pickerOpen}
                original={geometry.literalHex}
                pick={(color) => { read(); setReaderPicker(true); setReaderColor(color) }}
              />
              <DrawnPointer pointer={inside || (!touring && paused) ? null : frame.pointer} pressed={frame.pressed} />
            </div>
          </div>
          <div className="home-editor-footer">
            <span aria-hidden="true" className="home-editor-file-type"><IconFileCode size={14} stroke={1.75} />HTML</span>
            <span aria-hidden="true" className="home-editor-scene"><span>{String(sceneIndex + 1).padStart(2, '0')} / {String(features.length).padStart(2, '0')}</span>{$(features[sceneIndex].label)}</span>
            {!reduceMotion && (
              <button className="home-editor-playback" onClick={togglePlayback} type="button">
                {touring && !paused ? <IconPlayerPauseFilled aria-hidden="true" size={12} /> : <IconPlayerPlayFilled aria-hidden="true" size={12} />}
                {touring && !paused ? $('Pause demo') : $('Play demo')}
              </button>
            )}
          </div>
        </HomeEditorWindow>
      </div>
    </div>
  )
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
  const indent = 'text' in spans[0] ? spans[0].text.match(/^ +/)?.[0].length ?? 0 : 0
  return (
    <div className="home-editor-line" data-lit={lit ? '' : undefined} style={{ '--editor-indent': indent } as CSSProperties}>
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
    <span className="home-editor-class" data-editor-class={index} onPointerEnter={() => inspect(index)} onPointerLeave={() => inspect(null)}>
      {children}
    </span>
  )
}

function Swatch({ color, onClick }: { color: string, onClick?: () => void }) {
  const $ = useTranslation()
  const style = { '--editor-swatch': color } as CSSProperties
  return onClick
    ? <button aria-label={$('Edit literal color')} className="home-editor-swatch" data-editable="" onClick={onClick} style={style} type="button" />
    : <span aria-hidden="true" className="home-editor-swatch" style={style} />
}

/** A soft wash behind the class string that is lit, gliding from string to string with the caret. */
function ContextWash({ span }: { span: { line: number, from: number, to: number } | null }) {
  const { line, from, to } = useLast(span, { line: 0, from: 0, to: 0 })
  return <span aria-hidden="true" className="home-editor-context" data-visible={span ? '' : undefined} style={{ '--editor-anchor-line': line, '--editor-from': from, '--editor-to': to } as CSSProperties} />
}

function rangeStyle(geometry: Geometry, item: EditorClass) {
  const start = geometry.visual(item.line, item.column)
  return { '--editor-anchor-line': item.line, '--editor-from': start, '--editor-to': geometry.visual(item.line, item.column + item.name.length) } as CSSProperties
}

/** Where an overlay sits: its anchor line and visual column, as CSS variables the stylesheet places by. */
function anchorStyle(line: number, column: number, extra?: Record<string, string | number>) {
  return { '--editor-anchor-line': line, '--editor-anchor-column': column, ...extra } as CSSProperties
}

/** The language service's hover: the tokens a class uses, then the CSS it generates, in layers. */
function HoverCard({ animate, geometry, index, inspect, literalHex, model }: { animate: boolean, geometry: Geometry, index: number | null, inspect: (index: number | null) => void, literalHex: string, model: EditorModel }) {
  const $ = useTranslation()
  // The last card stays mounted so it can fold away instead of vanishing.
  const shown = useLast(index, model.hoverClass)
  const item = model.classes[shown]
  const hover = model.hovers[item.hover]
  const above = item.line > model.lines.length / 2
  const name = shown === model.literalClass ? item.name.replace(geometry.literalHex, literalHex) : item.name
  // A picked literal changes only the literal in this already-generated rule and its selector.
  const css = shown === model.literalClass ? hover.css.replaceAll(geometry.literalHex.slice(1), literalHex.slice(1)) : hover.css
  const lines = css.split('\n')
  return (
    <div
      className="home-editor-hover-card home-editor-pane"
      data-above={above ? '' : undefined}
      data-open={index !== null ? '' : undefined}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) inspect(null) }}
      onFocus={() => inspect(shown)}
      onPointerEnter={() => inspect(shown)}
      onPointerLeave={(event) => { if (!event.currentTarget.contains(document.activeElement)) inspect(null) }}
      style={anchorStyle(item.line, geometry.classStart(shown), {
        // The card's height is counted in lines, so its edges fall between lines of code, never through them.
        '--editor-card-lines': lines.length,
        '--editor-card-tokens': hover.tokens.length ? 1 : 0,
        '--editor-room-rows': above ? item.line : model.lines.length - item.line - 1
      })}>
      <div className="home-editor-hover-heading">
        <code>{shown === model.literalClass ? name : item.parts.map(([text, role], part) => <span data-role={role} key={part}>{text}</span>)}</code>
        <span>CSS</span>
      </div>
      <div className="home-editor-hover-content">
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions -- The generated-CSS viewport is read-only and supports keyboard scrolling. */}
        <pre tabIndex={index !== null ? 0 : -1} onKeyDown={scrollCSS}
          aria-label={$('Generated CSS')}
          className="home-editor-hover-css" data-reveal={animate && index !== null ? '' : undefined} key={shown} role="region">
          {lines.map((line, position) => <SyntaxLine key={position} line={line} position={position} />)}
        </pre>
      </div>
      {hover.tokens.length > 0 && (
        <div className="home-editor-hover-tokens">
          <IconVariable aria-hidden="true" size={14} stroke={1.75} />
          <span className="sr-only">{$('Token')}</span>
          {hover.tokens.map((token) => <code key={token}>{token}</code>)}
        </div>
      )}
    </div>
  )
}

/** Keyboard scrolling for the small CSS viewport, including browsers without default arrow scrolling. */
function scrollCSS(event: ReactKeyboardEvent<HTMLPreElement>) {
  if (event.altKey || event.ctrlKey || event.metaKey || !event.key.startsWith('Arrow')) return
  event.preventDefault()
  const viewport = event.currentTarget.parentElement!
  const step = parseFloat(getComputedStyle(event.currentTarget).lineHeight) * 2
  const left = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0
  const top = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0
  viewport.scrollBy({ left, top, behavior: 'instant' })
}

/** Actual CSS stays intact as the rule reveals from its first line to its declaration. */
function SyntaxLine({ line, position }: { line: string, position: number }) {
  return (
    <span className="home-editor-css-line" style={{ '--editor-line-delay': `${Math.min(position, 10) * 18}ms` } as CSSProperties}>
      {editorCSSParts(line).map(([text, role], part) => <span key={part} data-role={role}>{text}</span>)}
    </span>
  )
}

/** The completion menu, narrowed by the typed word, with the focused item's detail beside it. */
function SuggestWidget({ geometry, model, open, query }: { geometry: Geometry, model: EditorModel, open: boolean, query: string | null }) {
  const $ = useTranslation()
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
        <div className="home-editor-suggest-heading"><span>{$('Completions')}</span><span>{items.length}</span></div>
        {items.slice(0, menuRows).map((item, index) => (
          <div key={item.label} className="home-editor-suggest-item" data-focused={index === 0 ? '' : undefined}>
            <IconVariable aria-hidden="true" className="home-editor-suggest-icon" size={14} stroke={1.75} />
            <span className="home-editor-suggest-label">
              {[...item.label].map((character, position) => item.matches.includes(position) ? <b key={position}>{character}</b> : character)}
            </span>
          </div>
        ))}
        {items.length > menuRows && <span className="home-editor-suggest-scroll" style={{ '--editor-suggest-thumb': menuRows / items.length } as CSSProperties} />}
        {detail && <div className="home-editor-suggest-inline"><IconVariable aria-hidden="true" size={12} stroke={1.75} /><span>{token?.slice(7, -1)}</span></div>}
      </div>
      <div className="home-editor-pane home-editor-suggest-docs" data-open={open && detail ? '' : undefined}>
        <p className="home-editor-suggest-docs-token"><IconVariable aria-hidden="true" size={14} stroke={1.75} />{token?.slice(7, -1)}</p>
        <p className="home-editor-suggest-docs-scope">{scope}:</p>
        {/* Break the value only after its commas, never inside a custom property name. */}
        <p className="home-editor-suggest-docs-value">{value?.split(/(?<=,) /).map((part, index) => <span key={index}>{index ? ' ' : ''}<span className="home-editor-nowrap">{part}</span></span>)}</p>
      </div>
    </div>
  )
}

/** The editor's color picker on the literal: the new color, the original to revert to, a plane and two strips. */
function ColorPicker({ anchor, close, color, open, original, pick }: {
  anchor: { line: number, column: number }
  close: () => void
  color: HSV
  open: boolean
  original: string
  pick: (color: HSV) => void
}) {
  const $ = useTranslation()
  const hex = hsvToHex(color)
  const [hue, saturation, value] = color
  const escape = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      close()
    }
  }
  const drag = (event: ReactPointerEvent<HTMLElement>, apply: (x: number, y: number) => void) => {
    if (!event.isPrimary || event.button !== 0) return
    event.preventDefault()
    const target = event.currentTarget
    const update = (clientX: number, clientY: number) => {
      const rect = target.getBoundingClientRect()
      apply(Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)), Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)))
    }
    target.setPointerCapture(event.pointerId)
    update(event.clientX, event.clientY)
    const move = (moveEvent: PointerEvent) => { if (moveEvent.pointerId === event.pointerId) update(moveEvent.clientX, moveEvent.clientY) }
    const up = (endEvent: PointerEvent) => {
      if (endEvent.pointerId !== event.pointerId) return
      target.removeEventListener('pointermove', move)
      target.removeEventListener('pointerup', up)
      target.removeEventListener('pointercancel', up)
      target.removeEventListener('lostpointercapture', up)
    }
    target.addEventListener('pointermove', move)
    target.addEventListener('pointerup', up)
    target.addEventListener('pointercancel', up)
    target.addEventListener('lostpointercapture', up)
  }
  return (
    <div
      className="home-editor-pane home-editor-picker"
      aria-label={$('Color picker')}
      data-open={open ? '' : undefined}
      inert={!open}
      role="dialog"
      style={anchorStyle(anchor.line, anchor.column, { '--editor-picker-hue': hue })}>
      <div className="home-editor-picker-header" style={{ minHeight: picker.header }}>
        <label className="home-editor-picker-new" data-dark={isDark(hex) ? '' : undefined} style={{ backgroundColor: hex }} title={$('Edit literal color')}>
          <input aria-label={$('Literal color')} onChange={(event) => pick(hexToHsv(event.currentTarget.value))} onKeyDown={escape} type="color" value={hex} />
          <IconColorPicker aria-hidden="true" size={14} stroke={1.75} />
          <span>{hex}</span>
        </label>
        <button aria-label={$('Reset color')} className="home-editor-picker-original" onClick={() => pick(hexToHsv(original))} onKeyDown={escape} style={{ backgroundColor: original }} title={$('Reset color')} type="button" />
        <button aria-label={$('Close color picker')} className="home-editor-picker-close" onClick={() => close()} onKeyDown={escape} title={$('Close color picker')} type="button"><IconX aria-hidden="true" size={14} stroke={1.75} /></button>
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
  const { line, column, rows = 0, dx = 0, dy = 0, u = 0, v = 0, instant, picker: inPicker } = useLast(pointer, { line: 0, column: 0 })
  return (
    <svg
      className="home-editor-pointer"
      data-instant={instant ? '' : undefined}
      data-picker={inPicker}
      data-pressed={pressed ? '' : undefined}
      data-visible={pointer ? '' : undefined}
      height="20"
      style={anchorStyle(line, column, { '--editor-pointer-rows': rows, '--editor-pointer-dx': `${dx}px`, '--editor-pointer-dy': `${dy}px`, '--editor-pointer-u': u, '--editor-pointer-v': v })}
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
