'use client'

import { useEffect, useRef, type ComponentType, type CSSProperties, type SVGProps } from 'react'
import { IconBrandOpenai } from '@tabler/icons-react'
import { useInView } from 'react-intersection-observer'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import brands from '~/site/docs-shell/data/brands'
import claudeLogo from '~/site/assets/images/home/clients/claude.svg'
import clineLogo from '~/site/assets/images/home/clients/cline.svg'
import cursorLogo from '~/site/assets/images/home/clients/cursor.svg'
import copilotLogo from '~/site/assets/images/home/clients/githubcopilot.svg'
import geminiLogo from '~/site/assets/images/home/clients/googlegemini.svg'
import windsurfLogo from '~/site/assets/images/home/clients/windsurf.svg'
import zedLogo from '~/site/assets/images/home/clients/zedindustries.svg'
import type { AgentsCanvas } from './agents-canvas'

type Logo = ComponentType<SVGProps<SVGSVGElement>>
const MasterCSSLogo = brands.mastercss.src

function OpenAILogo(props: SVGProps<SVGSVGElement>) {
  return <IconBrandOpenai {...(props as object)} stroke={1.5} />
}

/** Local stdio clients. The links explain their setup; all brand marks remain native SVG. */
const mcpClients: { name: string, Logo: Logo, color?: string, anchor?: string }[] = [
  { name: 'Claude Code', Logo: claudeLogo, color: '#d97757', anchor: 'use-with-claude-code' },
  { name: 'Codex', Logo: OpenAILogo, anchor: 'use-with-codex-app' },
  { name: 'Cursor', Logo: cursorLogo },
  { name: 'GitHub Copilot', Logo: copilotLogo },
  { name: 'Gemini CLI', Logo: geminiLogo, color: '#8e75b2' },
  { name: 'Windsurf', Logo: windsurfLogo },
  { name: 'Zed', Logo: zedLogo, color: 'light-dark(#084ccf, color-mix(in oklab, #084ccf 50%, white))' },
  { name: 'Cline', Logo: clineLogo }
]

export interface AgentsOrbitCall { key: string, response: boolean }

/** Canvas owns the light, glass and signals; the DOM keeps the marks and setup links sharp. */
export function AgentsOrbit({ call, classRows, paused }: { call?: AgentsOrbitCall, classRows: readonly string[], paused: boolean }) {
  const $ = useTranslation()
  const { ref, inView } = useInView({ rootMargin: '300px', triggerOnce: true })
  const stage = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const renderer = useRef<AgentsCanvas>(undefined)
  const activity = useRef({ key: call?.key, response: call?.response, paused })
  activity.current = { key: call?.key, response: call?.response, paused }

  useEffect(() => {
    if (!inView || !stage.current || !canvas.current) return
    let disposed = false
    import('./agents-canvas').then(({ mountAgentsCanvas }) => {
      if (disposed || !stage.current || !canvas.current) return
      renderer.current = mountAgentsCanvas(stage.current, canvas.current, classRows)
      renderer.current?.activity(activity.current.key, activity.current.paused, activity.current.response)
    }).catch(() => {
      // The native marks, links and CSS figure remain usable if enhancement cannot load.
    })
    return () => {
      disposed = true
      renderer.current?.dispose()
      renderer.current = undefined
    }
  }, [inView, classRows])

  useEffect(() => { renderer.current?.activity(call?.key, paused, call?.response) }, [call?.key, call?.response, paused])

  return (
    <div className="home-mcp" ref={ref}>
      <div className="home-mcp-stage" ref={stage}>
        <span aria-hidden="true" className="home-marks home-mcp-frame" />
        <span aria-hidden="true" className="home-mcp-beam" />
        <canvas aria-hidden="true" className="home-mcp-canvas" ref={canvas} />
        <span aria-hidden="true" className="home-mcp-fallback-ring" />
        <ul aria-label={$('MCP clients')} className="home-mcp-clients">
          {mcpClients.map(({ color, name, Logo, anchor }, index) => (
            <li className="home-mcp-client" data-side={index === 0 || index >= 5 ? 'above' : 'below'} key={name} style={{ '--home-mcp-angle': `${index * 45 - 22.5}deg` } as CSSProperties}>
              <Link aria-label={name} className="home-mcp-client-link" href={`/guide/mcp-server#${anchor ?? 'configure-an-mcp-client'}`}>
                <span className="home-mcp-client-mark" style={color ? { '--home-brand': color } as CSSProperties : undefined}>
                  <Logo aria-hidden="true" height={22} width={22} />
                </span>
                <span className="home-mcp-client-name">{name}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="home-mcp-core">
          <MasterCSSLogo aria-hidden="true" height={34} width={34} />
          <span aria-hidden="true" className="home-mcp-core-label">MCP</span>
          <span className="sr-only">@master/css-mcp</span>
        </div>
      </div>
    </div>
  )
}
