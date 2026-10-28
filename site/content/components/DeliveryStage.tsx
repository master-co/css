import type { CSSProperties, ReactNode } from 'react'
import { compileRuntimeProgramSync, createRenderSessionSync } from '@master/css/node'
import clsx from 'clsx'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import preset from '~/site/utils/preset-manifest'
import { deliveryLateClass, deliveryLatePlan, deliveryMarkup, deliveryPlans, deliveryRenderedClasses, deliverySourceClasses, deliveryStations } from './delivery-content'

/*
 * Time on the stage runs from 0 to 4, one unit per moment: build, response, first paint, new class.
 * Every timed element carries the moment it appears at; the stage's `--home-delivery-t` decides
 * what exists. Server HTML renders the end of the timeline, so the drawing reads without script.
 */
const at = {
  static: { rules: 0.22, step: 0.09, link: 1.45, sheet: 2.2, page: 2.3, added: 3.08, late: 3.32 },
  progressive: { program: 0.35, style: 1.24, rules: 1.34, step: 0.085, sheet: 2.2, page: 2.28, engine: 2.45, added: 3.08, loading: 3.2, ready: 3.42, late: 3.62 },
  runtime: { program: 0.35, script: 1.4, page: 2.05, engine: 2.12, sheet: 2.16, rules: 2.28, step: 0.09, added: 3.08, late: 3.42 }
}
const responseLines = [1.06, 1.11, 1.16, 1.21, 1.26]
/** Always present: before the timeline starts. */
const always = -1

/** Presence from 0 to 1 once the timeline passes `moment`. */
const on = (moment: number) => `clamp(0, (var(--home-delivery-t) - ${moment}) * 10, 1)`
/** Presence between two moments. */
const between = (from: number, to: number) => `clamp(0, min(var(--home-delivery-t) - ${from}, ${to} - var(--home-delivery-t)) * 10, 1)`

interface SheetRule { className: string, text: string }

/** The rule the engine generates for each class, in the order the stylesheet holds them. */
function generate(classNames: readonly string[]) {
  const engine = createRenderSessionSync({ manifest: preset })
  try {
    const { classRules, cssText } = engine.ensureClassRules(classNames)
    const rules: SheetRule[] = classNames.map((className) => ({ className, text: classRules[className][0].text }))
    return rules.sort((a, b) => cssText.indexOf(a.text) - cssText.indexOf(b.text))
  } finally {
    engine.dispose()
  }
}

let cache: { rules: SheetRule[], program: string[] } | undefined
function stageData() {
  if (cache) return cache
  // The first bytes of the compiled project program, as a browser would fetch them.
  const bytes = [...compileRuntimeProgramSync(preset).slice(0, 24)].map((byte) => byte.toString(16).padStart(2, '0'))
  cache = {
    rules: generate(deliverySourceClasses),
    program: Array.from({ length: 3 }, (_, row) => bytes.slice(row * 8, row * 8 + 8).join(' '))
  }
  return cache
}

/** A rule as the engine emits it, minified, with its parts colored. */
function RuleText({ text }: { text: string }) {
  const [, selector, body] = text.match(/^([^{]+)\{([^}]*)\}$/)!
  return (
    <>
      <span className="home-delivery-code-selector">{selector}</span>{'{'}
      {body.split(';').filter(Boolean).map((declaration, index) => {
        const colon = declaration.indexOf(':')
        return (
          <span key={index}>
            {index > 0 && ';'}
            <span className="home-delivery-code-property">{declaration.slice(0, colon)}</span>:{declaration.slice(colon + 1)}
          </span>
        )
      })}
      {'}'}
    </>
  )
}

const tag = (name: string) => <span className="home-delivery-code-tag">{name}</span>
const attr = (name: string, value: ReactNode) => <> <span className="home-delivery-code-attr">{name}</span>=<span className="home-delivery-code-string">&quot;{value}&quot;</span></>

/** Class names inside markup, each one a place glyphs can leave from. */
function ClassTokens({ value }: { value: string }) {
  return value.split(' ').map((className, index) => (
    <span key={className}>
      {index > 0 && ' '}
      <span className="home-delivery-token" data-glyph={className}>{className}</span>
    </span>
  ))
}

interface Line {
  key: string
  at: number
  content: ReactNode
  /** The class whose rule this line is. */
  rule?: string
  /** The engine writes this line here: glyphs fall to it. */
  lands?: boolean
  /** The line lights up from this moment, as its class applies. */
  flash?: number
  carry?: { from: string, label: string }
  source?: string
}

/**
 * A panel whose lines arrive over time and keep their order: each line sits below the lines already
 * present, so a rule inserted between two others pushes the rest down. The panel's surface grows
 * with its lines, while its box always holds every line, so nothing around it moves.
 */
function Panel({ carry, className, head, headAt, lines, source }: { carry?: { from: string, label: string }, className?: string, head?: string, headAt: number, lines: Line[], source?: string }) {
  const style: Record<string, string | number> = { '--n': lines.length, '--head-on': on(headAt) }
  const arrival = { 'data-at': carry ? headAt : undefined, 'data-carry': carry?.label, 'data-carry-from': carry?.from }
  lines.forEach((line, index) => {
    style[`--p${index}`] = on(line.at)
  })
  style['--shown'] = lines.length ? `calc(${lines.map((_, index) => `var(--p${index})`).join(' + ')})` : 0
  return (
    <div className={clsx('home-delivery-panel', !head && 'home-delivery-panel-bare', className)} data-carry-source={source} {...(head ? {} : arrival)} style={style as CSSProperties}>
      {head && <div className="home-delivery-panel-head" {...arrival}>{head}</div>}
      <div className="home-delivery-lines">
        {lines.map((line, index) => (
          <div
            className={clsx('home-delivery-line', line.flash !== undefined && 'home-delivery-line-flash')}
            data-at={line.lands || line.carry ? line.at : undefined}
            data-carry={line.carry?.label}
            data-carry-from={line.carry?.from}
            data-carry-source={line.source}
            data-land={line.lands ? line.rule : undefined}
            key={line.key}
            style={{
              '--p': `var(--p${index})`,
              '--y': index ? `calc(${lines.slice(0, index).map((_, previous) => `var(--p${previous})`).join(' + ')})` : 0,
              // The mark fades before the timeline ends, so the last moment rests unmarked.
              '--flash': line.flash !== undefined ? between(line.flash, Math.min(line.flash + 0.5, 3.94)) : undefined
            } as CSSProperties}>
            {line.content}
          </div>
        ))}
      </div>
    </div>
  )
}

/** A stylesheet as lines: theme, the utilities layer and its rules in order. */
function sheetLines(rules: SheetRule[], moments: Record<string, number>, frame: number, options: { lands?: readonly string[], flash?: number } = {}): Line[] {
  return [
    { key: 'theme', at: frame, content: <><span className="home-delivery-code-at">@layer</span> theme{'{…}'}</> },
    { key: 'open', at: frame, content: <><span className="home-delivery-code-at">@layer</span> utilities{'{'}</> },
    ...rules.map((rule) => ({
      key: rule.className,
      at: moments[rule.className],
      content: <RuleText text={rule.text} />,
      rule: rule.className,
      lands: options.lands?.includes(rule.className),
      flash: rule.className === deliveryLateClass ? options.flash : undefined
    })),
    { key: 'close', at: frame, content: '}' }
  ]
}

function markupLines(text: (value: string) => string, moments?: readonly number[]): Line[] {
  return [
    ...deliveryMarkup.map((line, index) => ({
      key: line.tag,
      at: moments?.[index] ?? always,
      content: (
        <>
          {'indent' in line && '  '}
          {tag(`<${line.tag}`)}{attr('class', <ClassTokens value={line.className} />)}{tag('>')}
          {'text' in line && <>{line.text === '…' ? '…' : text(line.text)}{tag(`</${line.tag}>`)}</>}
        </>
      )
    })),
    { key: 'close', at: moments?.[3] ?? always, content: tag('</section>') }
  ]
}

function Variant({ children, modes }: { children: ReactNode, modes: string }) {
  return <div className="home-delivery-variant" data-mode={modes}>{children}</div>
}

/** Where the engine runs: class glyphs fall into the ring and leave as rules. */
function Engine({ active, carry, moment, states }: { active: [number, number][], carry?: { at: number, from: string, label: string }, moment: number, states?: { deferred: number, loading: number, ready: number } }) {
  const style: Record<string, string | number> = { '--at': moment }
  // Lit only while it writes: one window per burst of rules.
  style['--glow'] = active.length > 1 ? `max(${active.map(([from, to]) => between(from, to)).join(', ')})` : between(...active[0])
  if (states) style['--deferred'] = `clamp(0, (${states.ready} - var(--home-delivery-t)) * 10, 1)`
  return (
    <div className="home-delivery-engine home-delivery-timed" data-at={carry?.at} data-carry={carry?.label} data-carry-from={carry?.from} data-deferred={states ? '' : undefined} data-ring="" style={style as CSSProperties}>
      <span className="home-delivery-engine-ring" />
      {/* An image keeps the logo's gradient ids out of the page, so hidden copies cannot break visible ones. */}
      <img alt="" className="home-delivery-engine-logo" height={14} src="/images/logo.svg" width={26} />
      {/* A progressive page's engine names its state: the one word the drawing cannot show. */}
      {states && (
        <span className="home-delivery-engine-state">
          <code style={{ '--on': between(states.deferred, states.loading) } as CSSProperties}>deferred</code>
          <code style={{ '--on': between(states.loading, states.ready) } as CSSProperties}>loading</code>
          <code style={{ '--on': on(states.ready) } as CSSProperties}>ready</code>
        </span>
      )}
    </div>
  )
}

/** The rendered page, styled by whichever of its rules exist at this moment of the mode. */
function Page({ added, classes, page, text }: { added: number, classes: Record<string, number>, page: number, text: (value: string) => string }) {
  const style: Record<string, string> = { '--h-page': on(page), '--h-added': between(added, classes[deliveryLateClass] + 0.32) }
  for (const [className, moment] of Object.entries(classes)) style[`--h-${className.replace(/[^a-z]/g, '')}`] = on(moment)
  return (
    <div className="home-delivery-page" style={style as CSSProperties}>
      <div className="home-delivery-page-card" data-glyph={deliveryMarkup[0].className}>
        <div className="home-delivery-page-title" data-glyph={deliveryMarkup[1].className}>{text('Plans')}</div>
        <div className="home-delivery-page-plans" data-glyph={deliveryMarkup[2].className}>
          {deliveryPlans.map((plan, index) => (
            <span className={clsx('home-delivery-page-plan', index === deliveryLatePlan && 'home-delivery-page-plan-late')} data-glyph={index === deliveryLatePlan ? deliveryLateClass : undefined} key={plan} style={{ '--i': index } as CSSProperties}>
              {text(plan)}
              {index === deliveryLatePlan && <code className="home-delivery-page-added">+{deliveryLateClass}</code>}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

const scanned = (start: number, step: number, classNames: readonly string[]) => Object.fromEntries(classNames.map((className, index) => [className, start + index * step]))
const allAt = (moment: number) => Object.fromEntries(deliverySourceClasses.map((className) => [className, moment]))

export default function DeliveryStage() {
  const $ = useTranslation()
  const { program, rules } = stageData()
  const renderedRules = rules.filter((rule) => rule.className !== deliveryLateClass)
  const runtimeRules = { ...scanned(at.runtime.rules, at.runtime.step, deliveryRenderedClasses), [deliveryLateClass]: at.runtime.late }
  const [build, server, browser] = deliveryStations

  return (
    <div aria-hidden="true" className="home-delivery-board">
      {/* Build: source text on top; below it, what the build writes. */}
      <div className="home-delivery-station" data-station={build.id}>
        <p className="home-delivery-station-label">{$(build.label)}</p>
        <div className="home-delivery-markup">
          {/* Both source files in one panel: the page's markup, then the script that adds a class later. */}
          <Panel
            className="home-delivery-panel-fill"
            head="index.html"
            headAt={always}
            lines={[
              ...markupLines($),
              { key: 'gap', at: always, content: '' },
              { key: 'file', at: always, content: <span className="home-delivery-file">app.js</span> },
              { key: 'add', at: always, content: <>item.classList.add(<span className="home-delivery-code-string">&apos;<span className="home-delivery-token" data-glyph={deliveryLateClass}>{deliveryLateClass}</span>&apos;</span>)</> }
            ]}
            source="build-markup" />
        </div>
        <div className="home-delivery-gutter">
          <Variant modes="static">
            <Engine active={[[at.static.rules - 0.1, at.static.rules + at.static.step * 7]]} moment={always} />
          </Variant>
        </div>
        <div className="home-delivery-css">
          <Variant modes="static">
            <Panel head="app.css" headAt={at.static.rules - 0.08} lines={sheetLines(rules, scanned(at.static.rules, at.static.step, deliverySourceClasses), at.static.rules - 0.04, { lands: deliverySourceClasses })} source="build-css" />
          </Variant>
          <Variant modes="progressive runtime">
            <Panel
              head="program.bin"
              headAt={at.progressive.program - 0.04}
              lines={program.map((row) => ({ key: row, at: at.progressive.program, content: <span className="home-delivery-bytes">{row}</span> }))}
              source="build-program" />
          </Variant>
        </div>
      </div>

      {/* Server: the same markup as the HTML it sends; below it, what the document head carries. */}
      <div className="home-delivery-station" data-station={server.id}>
        <p className="home-delivery-station-label">{$(server.label)}</p>
        <div className="home-delivery-markup">
          <Panel
            carry={{ from: 'build-markup', label: 'index.html' }}
            className="home-delivery-panel-fill"
            headAt={1.02}
            lines={[...markupLines($, responseLines), { key: 'script', at: responseLines[4], content: <>{tag('<script')}{attr('src', '/app.js')}{tag('></script>')}</> }]}
            source="response-markup" />
        </div>
        <div className="home-delivery-gutter">
          <Variant modes="progressive">
            <Engine active={[[at.progressive.style - 0.04, at.progressive.rules + at.progressive.step * 6]]} moment={always} />
          </Variant>
        </div>
        <div className="home-delivery-css">
          <Variant modes="static">
            <Panel
              headAt={at.static.link}
              lines={[{ key: 'link', at: at.static.link, content: <>{tag('<link')}{attr('rel', 'stylesheet')}{attr('href', '/app.css')}{tag('>')}</>, carry: { from: 'build-css', label: 'app.css' }, source: 'response-css' }]} />
          </Variant>
          <Variant modes="progressive">
            <Panel
              headAt={at.progressive.style}
              lines={[
                { key: 'style', at: at.progressive.style, content: <>{tag('<style')}{attr('id', 'master-css')}</>, source: 'response-css' },
                // `attr` leads with a space: the continuation line indents by one, so it fits a station whole.
                { key: 'manifest', at: at.progressive.style, content: <>{attr('data-master-css-hydration-manifest', '…')}{tag('>')}</> },
                ...sheetLines(renderedRules, scanned(at.progressive.rules, at.progressive.step, deliveryRenderedClasses), at.progressive.style + 0.03, { lands: deliveryRenderedClasses }),
                { key: 'end', at: at.progressive.style, content: tag('</style>') }
              ]} />
          </Variant>
          <Variant modes="runtime">
            <Panel
              headAt={at.runtime.script}
              lines={[
                { key: 'script', at: at.runtime.script, content: <>{tag('<script')}{attr('type', 'module')}{attr('src', '/main.js')}{tag('>')}</> },
                { key: 'end', at: at.runtime.script, content: tag('</script>') }
              ]} />
          </Variant>
        </div>
      </div>

      {/* Browser: the page as painted; below it, the stylesheet that paints it. */}
      <div className="home-delivery-station" data-station={browser.id}>
        <p className="home-delivery-station-label">{$(browser.label)}</p>
        <div className="home-delivery-markup">
          <div className="home-delivery-window">
            <div className="home-delivery-window-bar">
              <span className="home-delivery-window-address" />
            </div>
            <div className="home-delivery-window-page" data-at={2.02} data-carry="HTML" data-carry-from="response-markup">
              <Variant modes="static">
                <Page added={at.static.added} classes={{ ...allAt(at.static.page), [deliveryLateClass]: at.static.late }} page={at.static.page} text={$} />
              </Variant>
              <Variant modes="progressive">
                <Page added={at.progressive.added} classes={{ ...allAt(at.progressive.page), [deliveryLateClass]: at.progressive.late }} page={at.progressive.page} text={$} />
              </Variant>
              <Variant modes="runtime">
                <Page added={at.runtime.added} classes={runtimeRules} page={at.runtime.page} text={$} />
              </Variant>
            </div>
          </div>
        </div>
        <div className="home-delivery-gutter">
          <Variant modes="progressive">
            <Engine
              active={[[at.progressive.late - 0.12, at.progressive.late + 0.06]]}
              carry={{ at: at.progressive.loading + 0.14, from: 'build-program', label: 'program.bin' }}
              moment={at.progressive.engine}
              states={{ deferred: at.progressive.engine, loading: at.progressive.loading, ready: at.progressive.ready }} />
          </Variant>
          <Variant modes="runtime">
            <Engine
              active={[[at.runtime.rules - 0.1, at.runtime.rules + at.runtime.step * 6], [at.runtime.late - 0.12, at.runtime.late + 0.06]]}
              carry={{ at: at.runtime.engine, from: 'build-program', label: 'program.bin' }}
              moment={at.runtime.engine} />
          </Variant>
        </div>
        <div className="home-delivery-css">
          <Variant modes="static">
            <Panel carry={{ from: 'response-css', label: 'app.css' }} head="app.css" headAt={at.static.sheet - 0.02} lines={sheetLines(rules, allAt(at.static.sheet), at.static.sheet, { flash: at.static.late })} />
          </Variant>
          <Variant modes="progressive">
            <Panel
              carry={{ from: 'response-css', label: 'style#master-css' }}
              head="style#master-css"
              headAt={at.progressive.sheet - 0.02}
              lines={sheetLines(rules, { ...allAt(at.progressive.sheet), [deliveryLateClass]: at.progressive.late }, at.progressive.sheet, { lands: [deliveryLateClass], flash: at.progressive.late })} />
          </Variant>
          <Variant modes="runtime">
            <Panel head="style#master-css" headAt={at.runtime.sheet} lines={sheetLines(rules, runtimeRules, at.runtime.sheet + 0.04, { lands: deliverySourceClasses, flash: at.runtime.late })} />
          </Variant>
        </div>
      </div>
    </div>
  )
}
