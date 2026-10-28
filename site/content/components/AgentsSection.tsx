import './agent.css'
import type { ComponentType, CSSProperties, SVGProps } from 'react'
import { IconArrowRight, IconBrandOpenai } from '@tabler/icons-react'
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
import AgentSession from './AgentSession'
import { HomeBentoCard, HomeBentoFrame, HomeBentoGrid, HomeSectionHeader } from './HomeBento'
import { agentSession, homeSections, mcpCommand, mcpTools } from './home-content'

type Logo = ComponentType<SVGProps<SVGSVGElement>>

const MasterCSSLogo = brands.mastercss.src

/** Tabler's outlined OpenAI mark, sized like the filled client logos. */
function OpenAILogo(props: SVGProps<SVGSVGElement>) {
  return <IconBrandOpenai {...(props as object)} size={24} stroke={1.5} />
}

/** MCP clients that run local stdio servers such as `@master/css-mcp`. */
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

/** Seconds each tool stays lit while the list walks through an agent's calls. */
const toolCallStep = 1.1

export default function AgentsSection() {
  const $ = useTranslation()
  return (
    <section id={homeSections.agents} className="home-section">
      <div className="app-wrapper home-section-wrap">
        <HomeSectionHeader
          index="06"
          label={$('AI agents')}
          title={$('Agents check their own changes.')}
          body={$('The MCP server gives coding agents your manifest, scanner and lint rules. They inspect classes, lint what they wrote and hand you fixes as diffs.')}>
          <Link className="home-section-link" href="/guide/mcp-server">
            {$('Set up the MCP server')}
            <IconArrowRight aria-hidden="true" size={16} stroke={1.75} />
          </Link>
        </HomeSectionHeader>
        <HomeBentoFrame>
          <HomeBentoGrid className="grid-cols(1) grid-cols(12)@md">
            <HomeBentoCard className="grid-col-span(12)@md home-reveal-item" title={$('Lint, preview, then apply')} body={$('An agent lints what it wrote, previews the fixes as a diff, and applies them only if the files have not changed since.')}>
              <div className="home-bento-visual">
                <AgentSession code={agentSession.code} file={agentSession.file} fixedCode={agentSession.fixedCode} problems={agentSession.problems} />
              </div>
            </HomeBentoCard>
            <HomeBentoCard className="grid-col-span(7)@md home-reveal-item" title={$('Works with your agent')} body={$('Any MCP client that runs local stdio servers, from Claude Code and Codex to Cursor and Zed.')}>
              <McpOrbit />
            </HomeBentoCard>
            <HomeBentoCard className="grid-col-span(5)@md home-reveal-item" title={$('Project tools')} body={$('Each tool reads the same manifest and rules as your build, and none of them writes without a confirmed preview.')}>
              <ol aria-label={$('MCP tools')} className="home-bento-visual home-mcp-tools" style={{ '--home-tool-cycle': `${mcpTools.length * toolCallStep}s` } as CSSProperties}>
                {mcpTools.map((tool, index) => (
                  <li className="home-mcp-tool" key={tool.name} style={{ animationDelay: `${index * toolCallStep}s` }}>
                    <code className="home-mcp-tool-name">{tool.name.replace('mastercss_', '')}</code>
                    <span className="home-mcp-tool-body">{$(tool.body)}</span>
                  </li>
                ))}
              </ol>
            </HomeBentoCard>
          </HomeBentoGrid>
        </HomeBentoFrame>
      </div>
    </section>
  )
}

/** Clients orbit the server on a tilted plane; their faces counter-rotate so they always read upright. */
function McpOrbit() {
  const $ = useTranslation()
  return (
    <div className="home-bento-visual home-mcp">
      <div className="home-mcp-stage">
        <div className="home-mcp-orbit">
          <span aria-hidden="true" className="home-mcp-ring" />
          <span aria-hidden="true" className="home-mcp-ring home-mcp-ring-inner" />
          <ul aria-label={$('MCP clients')} className="home-mcp-spin">
            {mcpClients.map(({ color, name, Logo }, index) => (
              <li className="home-mcp-slot" key={name} style={{ '--home-orbit-angle': index * 360 / mcpClients.length } as CSSProperties}>
                <span aria-hidden="true" className="home-mcp-spoke" />
                <span className="home-mcp-face">
                  <span className="home-mcp-client-logo" style={color ? { '--home-brand': color } as CSSProperties : undefined}>
                    <Logo aria-hidden="true" height={22} width={22} />
                  </span>
                  <span className="home-mcp-client-name">{name}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="home-mcp-core">
            <MasterCSSLogo aria-hidden="true" height={34} width={34} />
            <span className="font-2xs font-semibold fg-text-strong">@master/css-mcp</span>
            <span className="home-status home-status-live">stdio</span>
          </div>
        </div>
      </div>
      <code className="home-mcp-command home-terminal-line"><span aria-hidden="true" className="fg-text-muted">$</span> {mcpCommand}</code>
    </div>
  )
}
