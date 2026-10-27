import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import clsx from 'clsx'

export function HomeBentoFrame({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={clsx('home-bento-frame', className)} {...props} />
}

export function HomeBentoGrid({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={clsx('home-bento-grid', className)} {...props} />
}

/** A bento card with a heading block; `children` render below it as the visual. */
export function HomeBentoCard({ body, children, className, signal, title }: { body: string, children?: ReactNode, className?: string, signal?: string, title: string }) {
  return (
    <article className={clsx('home-bento-card', className)}>
      <div className="home-bento-card-header">
        {signal && <span className="home-workflow-signal">{signal}</span>}
        <h3 className="home-bento-card-title">{title}</h3>
        <p className="home-bento-card-body">{body}</p>
      </div>
      {children}
    </article>
  )
}

export function HomeSectionHeader({ body, children, index, label, title }: { body: string, children?: ReactNode, index: string, label: string, title: string }) {
  return (
    <header className="home-section-header">
      <p className="home-marker"><span className="home-marker-index">{index}</span>{label}</p>
      <h2 className="home-section-heading">{title}</h2>
      <div className="home-section-aside">
        <p className="home-section-body">{body}</p>
        {children}
      </div>
    </header>
  )
}
