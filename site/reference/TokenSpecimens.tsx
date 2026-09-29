import type { CSSProperties } from 'react'
import { foundationTokens, namespaceTokens, tokenSpecimenProperties } from '../common/foundation-data/tokens'
import '~/site/styles/token-specimens.css'

/** Preview authored default-scope values. Native CSS resolves their var() references. */
export default function TokenSpecimens({ namespace }: { namespace: string }) {
  const variables = Object.fromEntries(foundationTokens.flatMap(token => {
    const value = token.values.find(value => value.path.length === 1 && value.path[0] === ':root,:host')
    return value ? [[`--${token.name}`, value.value]] : []
  })) as CSSProperties
  const tokens = namespaceTokens(namespace).filter(token => !token.key.includes('--') && Object.hasOwn(variables, `--${token.name}`))
  return <section aria-labelledby="specimens">
    <div className={`token-specimens${namespace.startsWith('color') ? ' token-specimens-colors' : ''}`} style={variables}>
      {tokens.map(token => {
        const color = namespace.startsWith('color')
        const style = { [color ? 'backgroundColor' : tokenSpecimenProperties[namespace]]: `var(--${token.name})` } as CSSProperties
        if (namespace === 'text') {
          style.lineHeight = `var(--${token.name}--line-height, normal)`
          style.letterSpacing = `var(--${token.name}--letter-spacing, normal)`
        }
        return <a className="token-specimen" href={`#${token.key}`} key={token.key}>
          <span className={`token-specimen-preview${color ? ' token-specimen-color' : ''}`} style={style} aria-hidden="true">{color || ['radius', 'shadow'].includes(namespace) ? '' : 'Aa'}</span>
          <code>{token.key}</code>
        </a>
      })}
    </div>
  </section>
}
