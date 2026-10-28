'use client'

import { useState, type CSSProperties } from 'react'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'

export interface HoverInspectionToken {
  className: string
  /** The line and the character column the class starts at, for placing the highlight and the card. */
  line: number
  start: number
  css: string
}

/**
 * Markup whose classes show the CSS they generate when pointed at. Until the reader points, the
 * default class demonstrates it on a loop; the highlight and the card then follow the pointer.
 */
export default function HoverInspection({ defaultClassName, lines, tokens }: {
  defaultClassName: string
  lines: readonly string[]
  tokens: HoverInspectionToken[]
}) {
  const $ = useTranslation()
  const [inspected, setInspected] = useState<HoverInspectionToken>()
  const token = inspected ?? tokens.find((item) => item.className === defaultClassName) ?? tokens[0]
  return (
    <div
      aria-hidden="true"
      className="home-bento-visual home-hover-inspection"
      data-inspecting={inspected ? '' : undefined}
      onPointerLeave={() => setInspected(undefined)}
      style={{ '--home-token-line': token.line, '--home-token-start': `${token.start}ch`, '--home-token-length': `${token.className.length}ch` } as CSSProperties}>
      <div className="home-hover-code">
        {lines.map((line, index) => <MarkupLine key={line} line={line} onInspect={setInspected} tokens={tokens.filter((item) => item.line === index)} />)}
        <span className="home-hover-token" />
        <div className="home-hover-card">
          <p className="home-hover-card-title">{$('Generated CSS')}</p>
          <pre className="home-hover-card-css">{token.css}</pre>
        </div>
        <svg className="home-hover-cursor" height="22" viewBox="0 0 24 24" width="22">
          <path d="M5 3l14 7.5-6.2 1.6L10 18.5z" />
        </svg>
      </div>
    </div>
  )
}

/** Markup highlighted by hand, with each class in the attribute a target the pointer can inspect. */
function MarkupLine({ line, onInspect, tokens }: { line: string, onInspect: (token: HoverInspectionToken) => void, tokens: HoverInspectionToken[] }) {
  const match = line.match(/^(\s*)<(\w+) class="([^"]*)">(.*)$/)
  if (!match) return <div className="home-hover-line"><span className="home-code-tag">{line}</span></div>
  const closing = match[4].match(/<\/\w+>$/)?.[0]
  return (
    <div className="home-hover-line">
      {match[1]}<span className="home-code-tag">&lt;{match[2]}</span> <span className="home-code-attr">class</span>=<span className="home-code-string">&quot;
        {match[3].split(' ').map((className, index) => {
          const token = tokens.find((item) => item.className === className)
          return (
            <span key={className}>
              {index ? ' ' : ''}
              <span className="home-hover-class" onPointerEnter={token && (() => onInspect(token))}>{className}</span>
            </span>
          )
        })}
        &quot;</span><span className="home-code-tag">&gt;</span>{closing ? match[4].slice(0, -closing.length) : match[4]}{closing && <span className="home-code-tag">{closing}</span>}
    </div>
  )
}
