import type { ComponentPropsWithoutRef } from 'react'
import clsx from 'clsx'

type HomeBentoDivProps = ComponentPropsWithoutRef<'div'>
type HomeBentoArticleProps = ComponentPropsWithoutRef<'article'>

export const homeBentoGapClassName = 'gap:calc(var(--spacing-md)+1px)'
export const homeBentoCardHeaderClassName = 'flex flex-col p:2xl'
export const homeBentoCardTitleClassName = 'mx:0 mb:0 font:2xl font:medium text:strong'
export const homeBentoCardBodyClassName = 'max-w:64ch mx:0 mb:0 mt:sm text:sm text:muted'
export const homeBentoVisualClassName = 'rel overflow:hidden mx:calc(var(--spacing-sm)-1px) mb:calc(var(--spacing-sm)-1px) mt:auto r:xl outline:1px|solid|subtle bg:surface-muted'
export const homeBentoTopVisualClassName = 'rel overflow:hidden mx:calc(var(--spacing-sm)-1px) mb:calc(var(--spacing-sm)-1px) mt:0 r:xl outline:1px|solid|subtle bg:surface-muted'

export const homeBentoDotGridStyle = {
    backgroundImage: 'radial-gradient(var(--color-line-muted) 1px, transparent 1px)',
    backgroundSize: '14px 14px'
}

export function HomeBentoFrame({ className, ...props }: HomeBentoDivProps) {
    return (
        <div
            className={clsx('mx:-md mt:10x p:calc(var(--spacing-md)+1px) r:4xl surface:muted', className)}
            {...props} />
    )
}

export function HomeBentoGrid({ className, ...props }: HomeBentoDivProps) {
    return (
        <div
            className={clsx('grid', homeBentoGapClassName, className)}
            {...props} />
    )
}

export function HomeBentoCard({ className, ...props }: HomeBentoArticleProps) {
    return (
        <article
            className={clsx('flex flex-col r:2xl outline:1px|solid|subtle surface:base', className)}
            {...props} />
    )
}
