'use client'

import SearchSvg from '../../public/images/search.svg'
import { useSearch } from '../contexts/search'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  iconSize?: number
  hideIcon?: boolean
  children?: ReactNode
}

export default function SearchButton({ className, iconSize, hideIcon, children, onClick, ...props }: Props) {
  const { open, searchPlaceholder, searchLabel } = useSearch()
  return (
    <button {...props} type={props.type ?? 'button'} className={className} aria-label={props['aria-label'] ?? searchLabel} aria-keyshortcuts="Meta+K Control+K" onClick={event => { onClick?.(event); if (!event.defaultPrevented) open(event.currentTarget) }}>
      {children
        ? children
        : <>
          {!hideIcon && <SearchSvg className="mr-xs margin-left:-0.125rem fill-text-muted" width={iconSize || 20} height={iconSize || 20} />}
          {searchPlaceholder}
        </>
      }
    </button>
  )
}
