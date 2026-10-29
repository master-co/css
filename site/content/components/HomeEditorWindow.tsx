import './home-editor-window.css'
import type { ComponentPropsWithoutRef } from 'react'
import clsx from 'clsx'

/** Shared window material for the homepage editor and delivery workbench. */
export function HomeEditorWindow({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={clsx('home-editor-window', className)} {...props} />
}

export function HomeEditorBar({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={clsx('home-editor-bar', className)} {...props} />
}

export function HomeEditorLights() {
  return <span aria-hidden="true" className="home-editor-dots"><span /><span /><span /></span>
}

export function HomeEditorTab({ className, ...props }: ComponentPropsWithoutRef<'span'>) {
  return <span className={clsx('home-editor-tab', className)} {...props} />
}
