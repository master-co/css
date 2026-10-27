import '~/site/styles/token-specimens.css'
import Demo from '../Demo'
import DemoViewport from '../DemoViewport'
import DemoThemeComparison from '../DemoThemeComparison'
import ThemeNumberVariableTable from '../../ThemeNumberVariableTable'
import Palette, { type PaletteGroup } from './Palette'
import { demoDocument } from '../reference/document'
import { defaultValue, foundationScene, specimenCaption, specimenTokens, type FoundationToken } from '../../../common/foundation-data/specimens'

function TokenScene({ namespace, tokens, title, compare = false }: { namespace: string; tokens: FoundationToken[]; title: string; compare?: boolean }) {
  const scene = foundationScene(namespace, tokens.map(token => token.key))
  if (!scene.html) return null
  if (compare) return <DemoThemeComparison name={`tokens-${namespace}`} title={title} html={scene.html} css={scene.css} caption={scene.caption} />
  return <Demo title={title} background={namespace === 'radius' ? 'stripes' : 'plain'} padding="none" caption={scene.caption}>
    <DemoViewport title={title} document={demoDocument({ page: 'tokens', id: namespace, title, html: [], css: '', classes: [], classLists: [], highlighted: [] }, scene)} sizing="content" theme motion={scene.motion} />
  </Demo>
}

export default function FoundationTokensView({ namespace, keys, source }: { namespace: string; keys?: string[]; source?: React.ReactNode }) {
  if (namespace === 'breakpoints') return <ThemeNumberVariableTable namespace="breakpoint" />
  const tokens = specimenTokens(namespace, keys)
  if (namespace === 'color') {
    const groups = new Map<string, PaletteGroup>()
    const rest: FoundationToken[] = []
    for (const token of tokens) {
      const match = token.key.match(/^(.+)-(\d+)$/)
      if (!match) { rest.push(token); continue }
      const [, family, step] = match
      if (!groups.has(family)) groups.set(family, { family, colors: [] })
      groups.get(family)!.colors.push({ name: token.name, step: Number(step), value: defaultValue(token) })
    }
    const aliases = rest.filter(token => defaultValue(token).startsWith('var('))
    const specials = rest.filter(token => !aliases.includes(token))
    return <div data-foundation-tokens={namespace} data-token-keys={tokens.map(token => token.key).join(' ')}>
      {groups.size > 0 && <Demo title="Fixed color steps" background="plain" padding="sm" caption={specimenCaption.color}><Palette groups={[...groups.values()].map(group => ({ ...group, colors: group.colors.sort((a, b) => a.step - b.step) }))} /></Demo>}
      {aliases.length > 0 && <TokenScene namespace={namespace} tokens={aliases} title="Hue aliases" compare />}
      {specials.length > 0 && <TokenScene namespace={namespace} tokens={specials} title="Special colors" compare />}
    </div>
  }
  return <div data-foundation-tokens={namespace} data-token-keys={tokens.map(token => token.key).join(' ')}>
    {namespace === 'spacing' ? <><ThemeNumberVariableTable namespace="spacing" keys={keys} representation="spacing" /><p className="demo-caption">{specimenCaption.spacing}</p></>
      : <TokenScene namespace={namespace} tokens={tokens} title={namespace === 'shadow' ? 'Shadow scale' : namespace === 'radius' ? 'Corner radius scale' : namespace.replaceAll('-', ' ')} compare={namespace.startsWith('color-') || namespace === 'shadow'} />}
    {namespace === 'container' && <ThemeNumberVariableTable namespace="container" keys={keys} />}
    {source}
  </div>
}
