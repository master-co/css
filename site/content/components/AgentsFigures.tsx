'use client'

import { useEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties, type SVGProps } from 'react'
import { IconBrandOpenai } from '@tabler/icons-react'
import { useInView } from 'react-intersection-observer'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import brands from '~/site/docs-shell/data/brands'
import claudeLogo from '~/site/assets/images/home/clients/claude.svg'
import clineLogo from '~/site/assets/images/home/clients/cline.svg'
import cursorLogo from '~/site/assets/images/home/clients/cursor.svg'
import copilotLogo from '~/site/assets/images/home/clients/githubcopilot.svg'
import geminiLogo from '~/site/assets/images/home/clients/googlegemini.svg'
import windsurfLogo from '~/site/assets/images/home/clients/windsurf.svg'
import zedLogo from '~/site/assets/images/home/clients/zedindustries.svg'

type Logo = ComponentType<SVGProps<SVGSVGElement>>

const MasterCSSLogo = brands.mastercss.src

/** Tabler's outlined OpenAI mark, sized like the filled client logos. */
function OpenAILogo(props: SVGProps<SVGSVGElement>) {
  return <IconBrandOpenai {...(props as object)} stroke={1.5} />
}

/** MCP clients that start local stdio servers such as `@master/css-mcp`. Brand marks keep their own colors. */
const mcpClients: { name: string, Logo: Logo, color?: string }[] = [
  { name: 'Claude Code', Logo: claudeLogo, color: '#d97757' },
  { name: 'Codex', Logo: OpenAILogo },
  { name: 'Cursor', Logo: cursorLogo },
  { name: 'GitHub Copilot', Logo: copilotLogo },
  { name: 'Gemini CLI', Logo: geminiLogo, color: '#8e75b2' },
  { name: 'Windsurf', Logo: windsurfLogo },
  { name: 'Zed', Logo: zedLogo, color: '#084ccf' },
  { name: 'Cline', Logo: clineLogo }
]

/** A tool call in flight from the session above: `key` restarts the figure's animations for each call. */
export interface AgentsOrbitCall {
  key: string
}

/**
 * The server the session talks to, set open on the page under it. The project lies on the floor
 * as real classes, the server stands on it, and the clients that can start it stand on a ring
 * around it. Each call the session makes drops down the beam in gold; the server warms, a wave
 * lights the classes it reads, and the result climbs back in ink. It is a quiet accent under the
 * window, set apart by a little ground the beam bridges; the session above names every call.
 */
export function AgentsOrbit({ call, classRows, live }: { call?: AgentsOrbitCall, classRows: readonly string[], live?: boolean }) {
  const $ = useTranslation()
  const { ref, inView } = useInView({ threshold: 0.1 })
  const stage = useRef<HTMLDivElement>(null)
  const plane = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLSpanElement>(null)
  const [dial, setDial] = useState<{ path: string, dash: string }>()
  // The floor: rows of real classes, offset so the columns never line up.
  const floorRows = useMemo(() => Array.from({ length: 56 }, (_, row) => {
    const text = classRows[row % classRows.length]
    const offset = (row * 37) % text.length
    return <span key={row}>{(text.slice(offset) + text + text).slice(0, 190)}</span>
  }), [classRows])

  // The dial is drawn flat on the screen, along the ring's projected outline, so its ticks are evenly
  // spaced 1px marks of one length all the way round; ticks drawn on the tilted floor would foreshorten.
  useEffect(() => {
    const host = stage.current
    if (!host || !plane.current || !ring.current) return
    const measure = () => {
      if (!plane.current || !ring.current) return
      const box = host.getBoundingClientRect()
      const center = plane.current.getBoundingClientRect()
      const style = getComputedStyle(host)
      const lens = parseFloat(style.perspective)
      const [originX, originY] = style.perspectiveOrigin.split(' ').map(parseFloat)
      const { m22: cos, m23: sin } = new DOMMatrix(getComputedStyle(plane.current).transform)
      const radius = ring.current.offsetWidth / 2 + 28
      const cx = center.left - box.left
      const cy = center.top - box.top
      const points = Array.from({ length: 241 }, (_, step) => {
        const angle = step / 240 * Math.PI * 2
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius * cos
        const scale = lens / (lens - Math.sin(angle) * radius * sin)
        return [originX + (cx + x - originX) * scale, originY + (cy + y - originY) * scale]
      })
      const length = points.slice(1).reduce((total, [x, y], index) => total + Math.hypot(x - points[index][0], y - points[index][1]), 0)
      const ticks = Math.round(length / 14)
      setDial({ path: `M${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`, dash: `1 ${(length / ticks - 1).toFixed(3)}` })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="home-mcp" data-paused={inView ? undefined : ''} ref={ref}>
      <div className="home-mcp-stage" data-live={live ? '' : undefined} ref={stage}>
        <span aria-hidden="true" className="home-marks home-mcp-frame" />
        {/* The session's line to the server; its calls travel it. */}
        <span aria-hidden="true" className="home-mcp-beam">
          {call && <>
            <span className="home-mcp-beam-packet home-mcp-beam-request" key={`request-${call.key}`} />
            <span className="home-mcp-beam-packet home-mcp-beam-response" key={`response-${call.key}`} />
          </>}
        </span>
        {dial && (
          <svg aria-hidden="true" className="home-mcp-dial">
            <path d={dial.path} strokeDasharray={dial.dash} />
          </svg>
        )}
        <div className="home-mcp-plane" ref={plane}>
          <div aria-hidden="true" className="home-mcp-floor">
            <div className="home-mcp-floor-text">{floorRows}</div>
            {call && <div className="home-mcp-floor-text home-mcp-wave" key={call.key}>{floorRows}</div>}
          </div>
          {call && <span aria-hidden="true" className="home-mcp-glow" key={`glow-${call.key}`} />}
          {/* A hatched rim between the ring and the dial, like the margin of a drawing. */}
          <span aria-hidden="true" className="home-hatch home-mcp-rim" />
          <span aria-hidden="true" className="home-mcp-ring" ref={ring} />
          <ul aria-label={$('MCP clients')} className="home-mcp-spin">
            {mcpClients.map(({ color, name, Logo }, index) => (
              <li className="home-mcp-slot" key={name} style={{ '--home-orbit-angle': index * 360 / mcpClients.length } as CSSProperties}>
                <span aria-hidden="true" className="home-mcp-spoke" />
                <span aria-hidden="true" className="home-mcp-foot" />
                <span className="home-mcp-face">
                  <span className="home-mcp-client-logo home-mcp-glass" style={color ? { '--home-brand': color } as CSSProperties : undefined}>
                    <Logo aria-hidden="true" height={22} width={22} />
                  </span>
                  <span className="sr-only">{name}</span>
                </span>
              </li>
            ))}
          </ul>
          <span aria-hidden="true" className="home-mcp-core-foot home-mcp-foot" />
          <div className="home-mcp-core" key={call?.key}>
            <span className="home-mcp-core-face home-mcp-glass">
              <MasterCSSLogo aria-hidden="true" height={30} width={30} />
              <span className="sr-only">@master/css-mcp</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
