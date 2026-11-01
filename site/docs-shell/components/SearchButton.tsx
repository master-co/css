'use client'

import { IconSearch } from '@tabler/icons-react'
import { useSearch } from '../contexts/search'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode
}

/** Opens the page's search dialog. Without children it renders the search field trigger (`ui-search-trigger`) with its shortcut. */
export default function SearchButton({ className, children, onClick, ...props }: Props) {
  const { open, searchText, searchLabel } = useSearch()
  return (
    <button {...props} type={props.type ?? 'button'} className={className} aria-label={props['aria-label'] ?? searchLabel} aria-keyshortcuts="Meta+K Control+K" onClick={event => { onClick?.(event); if (!event.defaultPrevented) open(event.currentTarget) }}>
      {children ?? <>
        <IconSearch aria-hidden="true" stroke={1.5} />
        {searchText}
        <span className="ui-kbd" aria-hidden="true">⌘K</span>
      </>}
    </button>
  )
}
