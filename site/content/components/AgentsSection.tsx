import './agent.css'
import './agents-protocol.css'
import { flattenMasterCSSManifestVariables, type MasterCSSManifest } from '@master/css-schema/manifest'
import { createToolingSessionSync } from '@master/css-tooling/node'
import { IconArrowRight } from '@tabler/icons-react'
import Link from '~/site/docs-shell/components/Link'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import preset from '~/site/utils/preset-manifest'
import AgentSession, { type AgentSessionProps } from './AgentSession'
import { agentSessionCalls } from './agents-content'
import { HomeSectionHeader } from './HomeBento'
import HomeCompactIcon from './HomeCompactIcon'
import { agentSession, glyphFieldLines, homeSections } from './home-content'

export default function AgentsSection() {
  const $ = useTranslation()
  return (
    <section id={homeSections.agents} className="home-section">
      <div className="app-wrapper home-section-wrap">
        <HomeSectionHeader
          icon="section-ai-agents"
          index="06"
          label={$('AI agents')}
          title={$('Agents check their own changes.')}
          body={$('The MCP server gives coding agents your manifest and lint rules, so they check their own edits and hand you fixes as diffs.')}>
          <Link className="home-section-link" href="/guide/mcp-server">
            {$('Set up the MCP server')}
            <IconArrowRight aria-hidden="true" size={16} stroke={1.75} />
          </Link>
        </HomeSectionHeader>
        {/* One scene: the session's window, and tucked under it the server its calls reach. */}
        <AgentSession
          {...agentSession}
          {...sessionFacts()}
          toolIcons={{
            manifest: <HomeCompactIcon icon="mcp-manifest-query" />,
            inspect: <HomeCompactIcon icon="mcp-inspect-class" />,
            lint: <HomeCompactIcon icon="mcp-lint-project" />,
            preview: <HomeCompactIcon icon="mcp-preview-fixes" />,
            apply: <HomeCompactIcon icon="mcp-apply-preview" />,
            relint: <HomeCompactIcon icon="mcp-lint-project" />
          }}
          classRows={glyphFieldLines} />
      </div>
    </section>
  )
}

/**
 * What the server returns for the session's manifest query and class inspection, computed at build
 * time from the preset with the same tooling session `@master/css-mcp` uses.
 */
function sessionFacts(): Pick<AgentSessionProps, 'inspection' | 'tokens'> {
  const manifest = preset as unknown as MasterCSSManifest
  const { namespace } = agentSessionCalls.manifest.args
  const tokens = flattenMasterCSSManifestVariables(manifest.variables)
    .filter((variable) => variable.namespace === namespace)
    .map((variable) => ({ name: variable.name, value: String(variable.values[0].value) }))
  const session = createToolingSessionSync({ manifest })
  try {
    const inspection = session.inspectClassName(agentSessionCalls.inspect.args.className as string)
    const [rule] = inspection.rules
    const [{ variable }] = inspection.variables
    return {
      tokens,
      inspection: {
        selector: rule.selectorText ?? `.${inspection.className}`,
        declarations: inspection.declarations.map(({ property, value }) => ({ property, value })),
        matchStatus: inspection.matchStatus,
        cssSyntaxStatus: inspection.cssSyntaxStatus,
        layer: rule.layer ?? '',
        variable: { name: variable.name, value: String(variable.values[0].value) }
      }
    }
  } finally {
    session.dispose()
  }
}
