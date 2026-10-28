import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import clsx from 'clsx'
import Link from '~/site/docs-shell/components/Link'
import HomeIllustration, { type HomeIllustrationId } from './HomeIllustration'

export function HomeBentoFrame({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={clsx('home-bento-frame', className)} {...props} />
}

export function HomeBentoGrid({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={clsx('home-bento-grid', className)} {...props} />
}

/** A bento card with a heading block; `children` render below it as the visual. */
export function HomeBentoCard({ body, children, className, href, icon, title }: { body: string, children?: ReactNode, className?: string, href: string, icon: HomeIllustrationId, title: string }) {
  return (
    <article className={clsx('home-bento-card', className)}>
      <div className="home-bento-card-header">
        <div className="home-bento-card-caption">
          <div className="home-bento-card-copy">
            <h3 className="home-bento-card-title"><Link className="home-heading-link" href={href}>{title}</Link></h3>
            <p className="home-bento-card-body">{body}</p>
          </div>
          <HomeIllustration className="home-illustration-hung" icon={icon} size={112} />
        </div>
      </div>
      {children}
    </article>
  )
}

/** Every section opens with the same stack on the left rail: eyebrow, title, lead and an optional link. */
export function HomeSectionHeader({ body, children, icon, index, label, title }: { body: string, children?: ReactNode, icon: HomeIllustrationId, index: string, label: string, title: string }) {
  return (
    <header className="home-section-header">
      <div className="home-section-caption">
        <HomeIllustration icon={icon} />
        <p className="home-eyebrow"><span aria-hidden="true" className="home-eyebrow-index">{index}</span><span>{label}</span></p>
      </div>
      <h2 className="home-section-heading">{title}</h2>
      <p className="home-section-body">{body}</p>
      {children}
    </header>
  )
}
