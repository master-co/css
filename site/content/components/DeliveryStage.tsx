import type { CSSProperties, ReactNode } from 'react'
import { IconBraces, IconBrowser, IconFileCode, IconPlus, IconCheck, IconLink } from '@tabler/icons-react'
import clsx from 'clsx'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import { HomeEditorBar, HomeEditorLights, HomeEditorTab, HomeEditorWindow } from './HomeEditorWindow'
import DeliveryPreview from './DeliveryPreview'
import { getDeliveryProgram } from './delivery-program'
import { deliveryAdded, deliveryLateClass, deliveryOn as on, deliveryBetween as between, deliveryRuleAt, deliveryTiming, type DeliveryMode, type DeliveryRule } from './delivery-content'

const modes = ['static', 'progressive', 'runtime'] as const
const always = -1
const tag = (text: string) => <span className="home-delivery-code-tag">{text}</span>
const attr = (name: string, value: ReactNode) => <> <span className="home-delivery-code-attr">{name}</span>=<span className="home-delivery-code-string">&quot;{value}&quot;</span></>
function Token({ value }: { value: string }) { return <span className="home-delivery-token" data-glyph={value}>{value}</span> }
function Variant({ children, mode }: { children: ReactNode, mode: DeliveryMode }) { return <div className="home-delivery-variant" data-mode={mode}>{children}</div> }
interface Line { id: string, content: ReactNode, at?: number, reference?: boolean, edit?: boolean, rule?: string, engine?: string, source?: string, flash?: number, carrySource?: string, show?: number }

function CodeLines({ lines, source }: { lines: Line[], source: string }) {
  const $ = useTranslation()
  // Keyboard users need a focusable scroll region to read the complete document.
  // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
  return <div aria-label={source === 'template-markup' ? $('HTML template') : $('Generated CSS')} className="home-delivery-code-scroll" data-carry-source={source} role="region" tabIndex={0}>
    <div className="home-delivery-code" style={{ '--lines': lines.length } as CSSProperties}>
      {lines.map((line, index) => <div
        className={clsx('home-delivery-code-row', line.edit && 'home-delivery-edit-row', line.flash !== undefined && 'home-delivery-rule-row')}
        data-at={line.engine ? line.at : undefined}
        data-land={line.engine ? line.rule : undefined}
        data-engine={line.engine}
        data-glyph-source={line.source}
        data-carry-source={line.carrySource}
        data-edit-line={line.edit ? '' : undefined}
        data-reference-line={line.reference ? '' : undefined}
        data-line-at={line.show ?? line.at ?? always}
        key={line.id}
        style={{ '--on': on(line.show ?? line.at ?? always), '--flash': line.flash === undefined ? 0 : between(line.flash, 3.96) } as CSSProperties}>
        <span aria-hidden="true" className="home-delivery-line-number">{index + 1}</span><span className="home-delivery-line-content">{line.content}</span>
      </div>)}
    </div>
  </div>
}

function templateLines(mode: DeliveryMode): Line[] {
  const t = deliveryTiming[mode]
  const heads: Record<DeliveryMode, Line[]> = {
    static: [
      { id: 'link', at: t.reference, reference: true, content: <>    {tag('<link')}{attr('rel', 'stylesheet')}{attr('href', <span data-css-reference="">/app.css</span>)}{tag('>')}</> }
    ],
    progressive: [
      { id: 'style', at: t.reference, reference: true, content: <>    {tag('<style')}{attr('id', <span data-css-reference="">master-css</span>)}</> },
      { id: 'hydration', at: t.reference, content: <>      {attr('data-master-css-hydration-manifest', '…')}{tag('>')}</> },
      { id: 'fold', at: t.reference, content: <span className="home-delivery-code-comment">{'      /* … */'}</span> },
      { id: 'style-close', at: t.reference, content: <>    {tag('</style>')}</> }
    ],
    runtime: [
      { id: 'script', at: 1.08, content: <>    {tag('<script')}{attr('type', 'module')}{attr('src', '/main.js')}{tag('></script>')}</> },
      { id: 'style', at: t.reference, reference: true, content: <>    {tag('<style')}{attr('id', <span data-css-reference="">master-css</span>)}{tag('>')}</> },
      { id: 'fold', at: t.reference, content: <span className="home-delivery-code-comment">{'      /* CSSOM → */'}</span> },
      { id: 'style-close', at: t.reference, content: <>    {tag('</style>')}</> }
    ]
  }
  return [
    { id: 'doctype', content: <span className="home-delivery-code-comment">{'<!doctype html>'}</span> },
    { id: 'html', content: <>{tag('<html')}{attr('lang', 'en')}{tag('>')}</> },
    { id: 'head', content: <>  {tag('<head>')}</> },
    { id: 'charset', content: <>    {tag('<meta')}{attr('charset', 'utf-8')}{tag('>')}</> },
    { id: 'title', content: <>    {tag('<title>')}Acme · Plans{tag('</title>')}</> },
    { id: 'base', content: <>    {tag('<link')}{attr('rel', 'stylesheet')}{attr('href', '/base.css')}{tag('>')}</> },
    ...heads[mode],
    { id: 'head-close', content: <>  {tag('</head>')}</> },
    { id: 'body', content: <>  {tag('<body>')}</> },
    { id: 'main', content: <>    {tag('<main')}{attr('class', 'pricing')}{tag('>')}</> },
    { id: 'intro', content: <>      {tag('<header>')}…{tag('</header>')}</> },
    { id: 'plan', content: <>      {tag('<article')}</> },
    { id: 'classes', content: <>        <span className="home-delivery-code-attr">class</span>=<span className="home-delivery-code-string">&quot;plan <Token value="p-lg" /> <Token value="r-xl" /></span></> },
    { id: 'edit', edit: true, content: <>          <span className="home-delivery-template-new" style={{ '--added': on(deliveryAdded) } as CSSProperties}><Token value={deliveryLateClass} /> <span className="home-delivery-caret" /></span><span className="home-delivery-code-string"><Token value="shadow-sm" />&quot;</span>{tag('>')}</> },
    { id: 'plan-title', content: <>        {tag('<h2>')}Pro{tag('</h2>')}</> },
    { id: 'details', content: <span className="home-delivery-code-comment">        …</span> },
    { id: 'plan-close', content: <>      {tag('</article>')}</> },
    { id: 'main-close', content: <>    {tag('</main>')}</> },
    { id: 'app', content: <>    {tag('<script')}{attr('src', '/app.js')}{tag('></script>')}</> },
    { id: 'body-close', content: <>  {tag('</body>')}</> },
    { id: 'html-close', content: tag('</html>') }
  ]
}

function ruleLines(rules: DeliveryRule[], mode: DeliveryMode): Line[] {
  const lines: Line[] = [{ id: 'base', content: <span className="home-delivery-code-comment">{'/* Shared styles … */'}</span> }, { id: 'layer', content: <><span className="home-delivery-code-at">@layer</span> utilities {'{'}</> }]
  for (const rule of rules) {
    const [, selector, body] = rule.text.match(/^([^{]+)\{([^}]*)\}$/)!
    const colon = body.indexOf(':')
    const property = body.slice(0, colon)
    const value = body.slice(colon + 1)
    const moment = deliveryRuleAt(mode, rule.className)
    const late = rule.className === deliveryLateClass
    const engine = mode === 'progressive' ? late ? 'progressive-runtime' : 'progressive-server' : mode
    const metadata = { at: moment, show: late && mode !== 'static' ? moment - .1 : moment, flash: late ? mode === 'static' ? deliveryAdded : moment : undefined }
    lines.push({ id: `${rule.className}-selector`, ...metadata, rule: rule.className, engine, source: mode === 'static' && late ? 'template-action' : 'template-markup', carrySource: late ? 'css-late-rule' : undefined, content: <>  <span className="home-delivery-code-selector">{selector}</span> {'{'}</> })
    lines.push({ id: `${rule.className}-property`, ...metadata, content: <>    <span className="home-delivery-code-property">{property}</span>:{late ? '' : <> {value};</>}</> })
    if (late) lines.push({ id: `${rule.className}-value`, ...metadata, content: <>      {value};</> })
    lines.push({ id: `${rule.className}-close`, ...metadata, content: '  }' })
  }
  lines.push({ id: 'end', content: '}' })
  return lines
}

function PaneTitle({ children, file, icon, lights, status }: { children?: ReactNode, file: ReactNode, icon: ReactNode, lights?: boolean, status?: ReactNode }) {
  return <HomeEditorBar className="home-delivery-pane-bar">{lights && <HomeEditorLights />}<HomeEditorTab>{icon}{file}</HomeEditorTab>{status && <span className="home-delivery-pane-status home-editor-status">{status}</span>}{children}</HomeEditorBar>
}

function Processor({ mode }: { mode: DeliveryMode }) {
  const t = deliveryTiming[mode]
  const active = mode === 'static' ? between(t.rules - .1, 1) : `max(${between(t.rules - .12, t.rules + .6)}, ${between(3.28, t.lateRule + .14)})`
  const phases = mode === 'progressive' ? [
    { id: 'progressive-server', label: 'Server', show: `calc(1 - ${on(deliveryAdded)})`, deferred: false },
    { id: 'progressive-runtime', label: 'Runtime', show: on(deliveryAdded), deferred: true }
  ] : [{ id: mode, label: mode === 'static' ? 'Compiler' : 'Runtime', show: '1', deferred: false }]
  return <div className="home-delivery-engine-group" style={{ '--glow': active } as CSSProperties}>
    {phases.map(phase => <div className="home-delivery-engine" data-ring={phase.id} data-deferred={phase.deferred ? '' : undefined} key={phase.id} style={{ '--phase': phase.show, '--ready': phase.deferred ? on(deliveryTiming.progressive.ready) : 1 } as CSSProperties}>
      <span className="home-delivery-engine-core"><img alt="" src="/images/logo.svg" width="34" height="19" /><i /><i /></span>
      <span className="home-delivery-engine-label"><span className="home-delivery-engine-brand">Master CSS</span><span>{phase.label}</span></span>
      {phase.deferred && <span className="home-delivery-engine-state"><code style={{ '--on': `calc(1 - ${on(deliveryTiming.progressive.loading)})` } as CSSProperties}>deferred</code><code style={{ '--on': between(deliveryTiming.progressive.loading, deliveryTiming.progressive.ready) } as CSSProperties}>loading</code><code style={{ '--on': on(deliveryTiming.progressive.ready) } as CSSProperties}>ready</code></span>}
    </div>)}
  </div>
}

export default function DeliveryStage() {
  const $ = useTranslation()
  const program = getDeliveryProgram()
  const fileIcon = <IconFileCode aria-hidden="true" size={14} stroke={1.75} />
  return <HomeEditorWindow className="home-delivery-workbench">
    <fieldset className="home-delivery-mobile-view">
      <legend className="sr-only">{$('Code view')}</legend>
      <input aria-label={$('Template')} className="sr-only" defaultChecked id="home-delivery-view-template" name="home-delivery-view" type="radio" value="template" />
      <input aria-label="CSS" className="sr-only" id="home-delivery-view-css" name="home-delivery-view" type="radio" value="css" />
      <HomeEditorBar className="home-delivery-mobile-tabs"><label className="home-editor-tab" htmlFor="home-delivery-view-template">{fileIcon}index.html</label><label className="home-editor-tab" htmlFor="home-delivery-view-css"><IconBraces aria-hidden="true" size={14} stroke={1.75} />CSS</label></HomeEditorBar>
    </fieldset>
    <div className="home-delivery-board">
      <section className="home-delivery-pane home-delivery-template" data-station="template" aria-label={$('Template')}>
        <PaneTitle file="index.html" icon={fileIcon} lights status={$('Template')} />
        <div className="home-delivery-code-stack">{modes.map(mode => <Variant mode={mode} key={mode}><CodeLines lines={templateLines(mode)} source="template-markup" /></Variant>)}</div>
        <div className="home-delivery-template-action" data-carry-source="template-action"><button className="home-delivery-add" data-add-class="" disabled type="button"><IconPlus aria-hidden="true" size={13} stroke={1.75} /><span>{$('Add a class')}</span><code className="home-delivery-token" data-glyph={deliveryLateClass}>{deliveryLateClass}</code></button></div>
      </section>
      <div aria-hidden="true" className="home-delivery-process">{modes.map(mode => <Variant mode={mode} key={mode}><Processor mode={mode} /></Variant>)}</div>
      <section className="home-delivery-css home-delivery-pane" data-station="css" aria-label="CSS">
        <PaneTitle file={<button className="home-delivery-file-reference" data-inspect-css="" disabled type="button" aria-label={$('Inspect stylesheet reference')}><span className="home-delivery-filenames">{modes.map(mode => <span className="home-delivery-variant" data-mode={mode} key={mode}>{mode === 'static' ? 'app.css' : 'style#master-css'}</span>)}</span></button>} icon={<IconBraces aria-hidden="true" size={14} stroke={1.75} />} status={<span className="home-delivery-css-origin">{modes.map(mode => <span className="home-delivery-variant" data-mode={mode} key={mode}>{mode === 'static' ? 'CSS' : 'CSSOM'}</span>)}</span>} />
        <div className="home-delivery-code-stack">{modes.map(mode => <Variant mode={mode} key={mode}><CodeLines lines={ruleLines(program.rules, mode)} source="css-output" /></Variant>)}</div>
        <div className="home-delivery-css-footer home-delivery-pane-footer"><span className="home-delivery-footer-receipts">{modes.map(mode => <span className="home-delivery-variant" data-mode={mode} key={mode}><span className="home-delivery-css-receipt" style={{ '--on': on(mode === 'static' ? 3.2 : deliveryTiming[mode].lateRule) } as CSSProperties}><IconCheck aria-hidden="true" size={12} stroke={1.75} />{mode === 'static' ? $('Already generated') : $('1 rule added')}</span></span>)}</span><button aria-label={$('Inspect stylesheet reference')} className="home-delivery-inspect" data-inspect-css="" disabled title={$('Inspect stylesheet reference')} type="button"><IconLink aria-hidden="true" size={13} stroke={1.75} /></button></div>
      </section>
      <section className="home-delivery-browser home-delivery-pane" data-station="browser" aria-label={$('Preview')}>
        <PaneTitle file={$('Preview')} icon={<IconBrowser aria-hidden="true" size={14} stroke={1.75} />} status={<span className="home-delivery-live-dot">{$('Live')}</span>} />
        <DeliveryPreview {...program} />
        <div aria-hidden="true" className="home-delivery-arrivals">{modes.map(mode => <Variant mode={mode} key={mode}><span data-at={deliveryTiming[mode].sheet} data-carry={mode === 'static' ? 'app.css' : 'CSS'} data-carry-from="css-output" />{mode !== 'static' && <span data-at={deliveryTiming[mode].latePaint} data-lead="0.1" data-carry={deliveryLateClass} data-carry-from="css-late-rule" />}</Variant>)}</div>
        <div className="home-delivery-pane-footer">{modes.map(mode => <Variant mode={mode} key={mode}><span className="home-delivery-applied" style={{ '--on': on(deliveryTiming[mode].latePaint) } as CSSProperties}><IconCheck aria-hidden="true" size={12} stroke={1.75} />{$('Preview updated')}</span></Variant>)}</div>
      </section>
    </div>
  </HomeEditorWindow>
}
