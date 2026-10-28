import { renderToStaticMarkup } from 'react-dom/server'
import { IconArrowUpRight, IconCheck } from '@tabler/icons-react'
import { useTranslation } from '~/site/docs-shell/contexts/i18n'
import baseCSS from './delivery-preview.css?raw'
import { deliveryLateClass, deliveryRenderedClasses, type DeliveryRule } from './delivery-content'

/** A real stylesheet and real utility classes, isolated from the homepage's own runtime. */
export default function DeliveryPreview({ globals, rules }: { globals: string, rules: DeliveryRule[] }) {
  const $ = useTranslation()
  const markup = renderToStaticMarkup(<>
    <style>{'@layer theme, base, defaults, components, utilities;' + globals + baseCSS}</style>
    {rules.map(rule => <style data-delivery-rule={rule.className} data-rule-text={rule.text} key={rule.className}>{`@layer utilities{${rule.text}}`}</style>)}
    <div className="preview" data-preview-page="">
      <nav className="nav" aria-label={$('Demo workspace')}><span className="brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>acme</span><span className="avatar" aria-hidden="true">AL</span></nav>
      <header className="intro"><p className="eyebrow">{$('Your workspace')}</p><h1>{$('Make room for more.')}</h1><p>{$('Simple plans for your next big idea.')}</p></header>
      <article className={`plan ${deliveryRenderedClasses.join(' ')} ${deliveryLateClass}`} data-preview-plan="" data-selected="">
        <div className="plan-heading"><h2>Pro</h2><span className="selected"><IconCheck aria-hidden="true" size={11} stroke={2} />{$('Selected')}</span></div>
        <p className="price">$19<small>/ {$('month')}</small></p>
        <p className="caption">{$('A little more space to do your best work.')}</p>
        <ul className="features"><li><IconCheck aria-hidden="true" size={13} stroke={1.75} />{$('Unlimited projects')}</li><li><IconCheck aria-hidden="true" size={13} stroke={1.75} />{$('Advanced insights')}</li><li><IconCheck aria-hidden="true" size={13} stroke={1.75} />{$('Priority support')}</li></ul>
        <button data-preview-select="" type="button" aria-pressed="true" aria-disabled="true"><span><span className="choose">{$('Select Pro')}</span><span className="pending">{$('Applying…')}</span><span className="current">{$('Your plan')}</span></span><IconArrowUpRight aria-hidden="true" size={14} stroke={1.75} /></button>
      </article>
      <p className="billing">{$('Monthly billing. Cancel anytime.')}</p>
    </div>
  </>)
  return <div className="home-delivery-preview-host" data-preview-host="" dangerouslySetInnerHTML={{ __html: `<template shadowrootmode="open">${markup}</template>` }} />
}
