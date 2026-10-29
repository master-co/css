import { IconArrowUpRight, IconCheck, IconX } from '@tabler/icons-react'
import { brandAssets, brandColorRoles, brandExampleMarkup, brandFunctionalColors, brandLogoGeometry, brandLogoMinimums, brandLogoRules, brandMarkGradientStops, brandPrinciples, brandRoleGuidance, brandTypeRoles, brandVoiceExamples } from '~/site/common/brand'
import { brandPalette, brandScale, brandTiming } from '~/site/common/brand-foundations'
import DemoAsset from '~/site/components/demo/DemoAsset'
import CodeTabs from '~/site/docs-shell/components/CodeTabs'
import Link from '~/site/docs-shell/components/Link'
import BrandColor from './BrandColor'

export function BrandPrinciples() {
  return <div className="brand-principles">{brandPrinciples.map((principle, index) => <section key={principle.title}><span className="brand-overline">0{index + 1}</span><h3>{principle.title}</h3><p>{principle.description}</p></section>)}</div>
}

export function BrandLogoSystem() {
  return <div className="brand-logo-system">
    <div className="brand-lockup-board"><span className="brand-overline">The complete signature</span><div className="brand-lockup-space"><img src="/images/css-logotype@light.svg" className="brand-logo-light" width="460" height="55" alt="Master CSS horizontal logotype for light backgrounds" /><img src="/images/css-logotype@dark.svg" className="brand-logo-dark" width="460" height="55" alt="Master CSS horizontal logotype for dark backgrounds" /><span className="brand-lockup-clearance">x</span></div><span className="brand-logo-equation">x = ¼ mark height</span></div>
    <dl className="brand-logo-rules">{brandLogoRules.map(rule => <div key={rule.title}><dt>{rule.title}</dt><dd><strong>{rule.value}</strong><p>{rule.description}</p></dd></div>)}</dl>
    <dl className="brand-logo-geometry">{brandLogoGeometry.map(geometry => <div key={geometry.title}><dt>{geometry.title}</dt><dd><code>{geometry.ratio}</code><span>Original SVG canvas ratio</span></dd></div>)}</dl>
    <div className="brand-logo-minimums"><div><span className="brand-overline">At actual CSS size</span><p>Check the mark and lettering where they will be used.</p></div><figure><div><img src="/images/logo.svg" width="104" height="56" style={{ height: brandLogoMinimums.markHeight, width: 'auto' }} alt="Master CSS mark at its minimum height" /></div><figcaption>{brandLogoMinimums.markHeight}px high</figcaption></figure><figure><div><img src="/images/css-logotype@light.svg" className="brand-logo-light" width="460" height="55" style={{ width: brandLogoMinimums.lockupWidth, height: 'auto' }} alt="Master CSS logotype at its minimum width on light backgrounds" /><img src="/images/css-logotype@dark.svg" className="brand-logo-dark" width="460" height="55" style={{ width: brandLogoMinimums.lockupWidth, height: 'auto' }} alt="Master CSS logotype at its minimum width on dark backgrounds" /></div><figcaption>{brandLogoMinimums.lockupWidth}px wide</figcaption></figure></div>
    <div className="brand-logo-use"><div><IconCheck size={18} aria-hidden="true" /><strong>Keep its character.</strong><p>Use the supplied artwork, keep its proportions, and choose the lettering for its background.</p></div><div><IconX size={18} aria-hidden="true" /><strong>Keep the mark intact.</strong><p>Do not redraw, stretch, rotate, recolor or add effects. Clear space stays clear of text and edges.</p></div></div>
  </div>
}

export function BrandColors() {
  const palette = brandPalette()
  return <div className="brand-colors">
    <div className="brand-gold-story"><div className="brand-gold-art"><img src="/images/logo.svg" width="184" height="100" alt="Original gold gradient in the standalone Master CSS mark" /></div><div><span className="brand-overline">The signature / Gold</span><h3>A point of warmth.</h3><p>The original logo keeps its own artwork and gradients. Interface gold uses the preset amber family; it is a small signal, not a substitute for readable text or functional status colors.</p><div className="brand-inline-values">{brandMarkGradientStops.map(stop => <code key={stop}>{stop}</code>)}<small>Central ribbon endpoints. All intermediate stops stay in the SVG.</small></div></div></div>
    <div className="brand-palette">{palette.map(color => <BrandColor key={color.key} title={color.key.replace('amber', 'Gold · amber').replace('zinc', 'Zinc')} token={color.token} value={color.value} />)}</div>
    <h3>Roles that follow the theme</h3><p className="brand-specimen-intro">A role describes a job. Its color adapts to the surface and theme. The readings below show the current rendered color; copy the variable to preserve that relationship.</p><p className="brand-specimen-intro">{brandRoleGuidance} <Link href="/guide/theme">Define roles in your theme <span aria-hidden="true">→</span></Link></p>
    <div className="brand-role-palette">{brandColorRoles.map(role => <BrandColor key={role.token} {...role} />)}</div>
    <div className="brand-functional-colors">{brandFunctionalColors.map(role => <div key={role.title} data-role={role.title}><span aria-hidden="true" /><strong>{role.title}</strong><p>{role.description}</p><code>{role.token}</code></div>)}</div>
  </div>
}

export function BrandTypography() {
  const sizes = brandScale('font-size', brandTypeRoles.map(role => role.token.slice('--font-size-'.length)))
  return <div className="brand-typography">
    <div className="brand-font-families"><div><span className="brand-overline">Latin / Geist</span><strong>Aa</strong><p>Clear, contemporary, and close to the work.</p></div><div><span className="brand-overline">繁體中文 / Noto Sans TC</span><strong lang="zh-Hant">永</strong><p lang="zh-Hant">清晰的結構，讓每個細節各得其所。</p></div><div><span className="brand-overline">Code / IBM Plex Mono</span><strong className="brand-mono">{'{ }'}</strong><p className="brand-mono">0123456789<br />Aa / --token</p></div></div>
    <div className="brand-type-scale">{brandTypeRoles.map((role, index) => <div className="brand-type-row" key={role.title} data-size-token={role.token} data-size-rem={sizes[index].rem}><div><strong>{role.title}</strong><code>{role.token}</code><small>{sizes[index].value} · {sizes[index].px}px at a 16px root</small></div><div><p className={role.title === 'Code' ? 'brand-mono' : undefined}>{role.sample}</p><span>{role.description}</span></div></div>)}</div>
    <div className="brand-reading-example"><span className="brand-overline">Reading rhythm</span><h3>A little space makes the structure clear.</h3><p>Keep related ideas together. Let a paragraph finish before the next begins, and use a larger interval to introduce a new section. A reading column should remain comfortable on a wide screen and adapt naturally on a narrow one.</p><p lang="zh-Hant">段落保有完整的意思，相關的資訊彼此靠近。中英文混排時，保留自然的行高與標點，不把拉丁字母的字距直接套用到中文。</p><div className="brand-number-specimen"><span>Aligned values</span><code>012,345.67</code><code>108,902.34</code></div></div>
  </div>
}

export function BrandGeometry() {
  const spacing = brandScale('spacing', ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'])
  const radii = brandScale('radius', ['md', 'lg', 'xl', '2xl', '3xl'])
  return <div className="brand-geometry">
    <div className="brand-spacing-scale">{spacing.map(entry => <div key={entry.key}><code>{entry.key}</code><span className="brand-spacing-track"><span style={{ width: `${entry.rem}rem` }} /></span><span>{entry.value}</span><small>{entry.px}px at a 16px root</small></div>)}</div>
    <div className="brand-radii">{radii.map(entry => <div key={entry.key}><span style={{ borderRadius: entry.value }} /><code>{entry.key}</code><small>{entry.value}</small></div>)}</div>
    <div className="brand-materials"><div className="brand-fitted-shell"><div className="brand-fitted-panel"><span className="brand-overline">A fitted relationship</span><strong>Close around the surface.<br />Open around the content.</strong><p>At a 16px root, the shell has an 8px inset. Its 24px radius surrounds a 16px panel; a physical border belongs in the inner-face measurement.</p></div></div><dl><div><dt>Flat</dt><dd>A clear surface and one deliberate boundary.</dd></div><div><dt>Raised</dt><dd>A short contact shadow when a surface needs separation.</dd></div><div><dt>Floating</dt><dd>More distance for a dialog or menu above the work.</dd></div><div><dt>Glass</dt><dd>Local to a floating tool, with readable content and a real backdrop.</dd></div></dl></div>
  </div>
}

export function BrandMotion() {
  return <div className="brand-motion-tokens">{brandTiming().map(entry => <div key={entry.token}><code>{entry.token}</code><strong>{entry.value}</strong><span>{entry.token.endsWith('fast') ? 'Direct feedback' : entry.token.endsWith('normal') ? 'A change of context' : 'A considered arrival'}</span></div>)}</div>
}

export function BrandApplications() {
  return <div className="brand-applications">
    <section className="brand-application-doc"><div className="brand-application-bar"><span className="brand-overline">01 / Documentation</span><Link href="/guide/introduction">Open the Guide <IconArrowUpRight size={14} aria-hidden="true" /></Link></div><div className="brand-mini-document"><nav aria-label="Sample document links"><strong>Guide</strong><Link href="/guide/introduction">Introduction</Link><Link href="/guide/installation">Installation</Link><Link href="/guide/theme">Theme tokens</Link></nav><div><span className="brand-overline">Getting started</span><h3>A shared language</h3><p>Keep the decisions close to the work. Start with readable markup, then give shared values a name.</p><code className="brand-code-line">display:grid gap-md p-lg</code><Link href="/guide/introduction">Write your first class <span aria-hidden="true">→</span></Link></div></div></section>
    <section className="brand-application-reference"><div className="brand-application-bar"><span className="brand-overline">02 / Reference</span><Link href="/reference/tokens/spacing">View tokens <IconArrowUpRight size={14} aria-hidden="true" /></Link></div><table><caption>Names, values and uses stay aligned.</caption><thead><tr><th>Token</th><th>Value</th><th>Use</th></tr></thead><tbody>{brandScale('spacing', ['sm', 'md', 'lg']).map((entry, index) => <tr key={entry.key}><th><code>{entry.token}</code></th><td><code>{entry.value}</code></td><td>{['Related details', 'A comfortable inset', 'Space between groups'][index]}</td></tr>)}</tbody></table></section>
    <section className="brand-application-code"><div className="brand-application-bar"><span className="brand-overline">03 / In markup</span><span>One inspectable example</span></div><div className="brand-code-preview"><section className="display:grid gap-md p-lg r-xl bg-surface-raised"><h3 className="margin:0 text-xl fg-text-strong">A shared language</h3><p className="margin:0 text-sm fg-text-muted">Keep the decisions close to the work.</p><Link className="fg-text-link" href="/guide">Explore the Guide</Link></section></div><CodeTabs>{[{ name: 'panel.html', lang: 'html', code: brandExampleMarkup }]}</CodeTabs></section>
    <section className="brand-application-release"><div className="brand-application-bar"><span className="brand-overline">04 / Announcement</span><Link href="/blog">Read the Blog <IconArrowUpRight size={14} aria-hidden="true" /></Link></div><div className="brand-release-card"><img src="/images/logo.svg" width="74" height="40" alt="Master CSS" /><span className="brand-overline">Built around the details</span><h3>Clear by design.</h3><p>One language for the system.<br />Room for what you make.</p><span className="brand-release-signature">Master CSS <span>css.master.co</span></span></div></section>
  </div>
}

export function BrandVoice() {
  return <div className="brand-voice-examples">{brandVoiceExamples.map(example => <section key={example.context}><h3>{example.context}</h3><div><span className="brand-voice-label"><IconCheck size={15} aria-hidden="true" /> Clear and useful</span><p>{example.preferred}</p></div><div data-avoid="true"><span className="brand-voice-label"><IconX size={15} aria-hidden="true" /> Avoid</span><p>{example.avoid}</p></div></section>)}</div>
}

export function BrandDownloads() {
  return <div className="brand-downloads"><h3 id="logotype">Logotype</h3>{brandAssets.slice(0, 2).map(asset => <DemoAsset key={asset.src} {...asset} />)}<h3 id="mark">Mark</h3><p>The checkerboard indicates transparency and is not part of the downloaded file.</p><DemoAsset {...brandAssets[2]} /></div>
}
