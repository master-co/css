'use client'

import SearchSvg from '../../public/images/search.svg'
import { useSearch } from '../contexts/search'

export default function SearchButton({ className, iconSize, hideIcon, children }: any) {
  const { open, close, searchPlaceholder } = useSearch()
  return (
    <button className={className} onClick={open}>
      {children
        ? children
        : <>
          {!hideIcon && <SearchSvg className="ml:-0.125rem mr-xs fill-text-disabled" width={iconSize || 20} height={iconSize || 20} />}
          {searchPlaceholder}
        </>
      }
    </button>
  )
}
