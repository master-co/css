import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import clsx from 'clsx'

export function HomeBentoFrame({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={clsx('home-bento-frame', className)} {...props} />
}

export function HomeBentoGrid({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={clsx('home-bento-grid', className)} {...props} />
}

/** A bento card with a heading block; `children` render below it as the visual. */
export function HomeBentoCard({ body, children, className, title }: { body: string, children?: ReactNode, className?: string, title: string }) {
  return (
    <article className={clsx('home-bento-card', className)}>
      <div className="home-bento-card-header">
        <h3 className="home-bento-card-title">{title}</h3>
        <p className="home-bento-card-body">{body}</p>
      </div>
      {children}
    </article>
  )
}

/** Every section opens with the same stack on the left rail: eyebrow, title, lead and an optional link. */
export function HomeSectionHeader({ body, children, index, label, title }: { body: string, children?: ReactNode, index: string, label: string, title: string }) {
  return (
    <header className="home-section-header">
      <p className="home-eyebrow"><span aria-hidden="true" className="home-eyebrow-index">{index}</span><span>{label}</span></p>
      <h2 className="home-section-heading">{title}</h2>
      <p className="home-section-body">{body}</p>
      {children}
    </header>
  )
}
