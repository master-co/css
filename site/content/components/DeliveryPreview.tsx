import { renderToStaticMarkup } from 'react-dom/server'
import { IconArrowUpRight, IconCheck, IconPlus, IconRefresh } from '@tabler/icons-react'
import { useI18n, useTranslation } from '~/site/docs-shell/contexts/i18n'
import { useLocale } from '~/site/docs-shell/contexts/locale'
import { localizePathname } from '~/site/docs-shell/utils/i18n-pathname'
import HomeIllustration, { type HomeIllustrationId } from './HomeIllustration'
import { deliveryModes } from './home-content'
import baseCSS from './delivery-preview.css?raw'
import { deliveryLateClass, deliveryRenderedClasses, type DeliveryMode, type DeliveryRule } from './delivery-content'

const artwork = {
  static: 'render-static',
  progressive: 'render-progressive',
  runtime: 'render-runtime'
} satisfies Record<DeliveryMode, HomeIllustrationId>

/** The mode explainer is the example page itself, styled by the inspector's real rules. */
export default function DeliveryPreview({ globals, rules }: { globals: string, rules: DeliveryRule[] }) {
  const $ = useTranslation()
  const locale = useLocale()
  const i18n = useI18n()
  const markup = renderToStaticMarkup(<>
    <style>{'@layer theme, base, defaults, components, utilities;' + globals + baseCSS}</style>
    {rules.map(rule => <style data-delivery-rule={rule.className} data-rule-text={rule.text} key={rule.className}>{`@layer utilities{${rule.text}}`}</style>)}
    <div className="preview" data-preview-page="">
      <article className={`demo ${deliveryRenderedClasses.join(' ')} ${deliveryLateClass}`} data-preview-sample="" data-applied="">
        <div className="mode-stack">
          {deliveryModes.map(mode => <section className="preview-mode" data-preview-mode={mode.id} key={mode.id}>
            <div className="mode-heading"><HomeIllustration icon={artwork[mode.id]} size={64} />{'default' in mode && mode.default && <span className="mode-default">{$('Default')}</span>}</div>
            <h1>{$(mode.title)}</h1>
            <p className="description">{$(mode.body)}</p>
            <a className="mode-guide" href={localizePathname(mode.href, { defaultLocale: i18n.defaultLocale, locale, locales: i18n.locales, localizablePathnameRoots: i18n.localizablePathnameRoots })}>{$('Explore this mode')}<IconArrowUpRight aria-hidden="true" size={14} stroke={1.75} /></a>
          </section>)}
        </div>
        <div className="demo-change">
          <span className="change-class"><span className="change-dot" aria-hidden="true" /><code id="delivery-preview-class">{deliveryLateClass}</code><IconCheck aria-hidden="true" className="change-check" size={13} stroke={1.75} /></span>
          <button aria-describedby="delivery-preview-class" data-preview-change="" disabled type="button"><span className="change-idle"><IconPlus aria-hidden="true" size={13} stroke={1.75} />{$('Apply')}</span><span className="change-pending">{$('Applying…')}</span><span className="change-replay"><IconRefresh aria-hidden="true" size={13} stroke={1.75} />{$('Replay')}</span></button>
        </div>
      </article>
    </div>
  </>)
  return <div className="home-delivery-preview-host" data-preview-host="" dangerouslySetInnerHTML={{ __html: `<template shadowrootmode="open">${markup}</template>` }} />
}
