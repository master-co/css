import type { ComponentPropsWithoutRef } from 'react'
import clsx from 'clsx'

type HomeBentoDivProps = ComponentPropsWithoutRef<'div'>
type HomeBentoArticleProps = ComponentPropsWithoutRef<'article'>

export function HomeBentoFrame({ className, ...props }: HomeBentoDivProps) {
    return (
        <div
            className={clsx('home-bento-frame', className)}
            {...props} />
    )
}

export function HomeBentoGrid({ className, ...props }: HomeBentoDivProps) {
    return (
        <div
            className={clsx('home-bento-grid', className)}
            {...props} />
    )
}

export function HomeBentoCard({ className, ...props }: HomeBentoArticleProps) {
    return (
        <article
            className={clsx('home-bento-card', className)}
            {...props} />
    )
}
