import clsx from 'clsx'
import type { CSSProperties } from 'react'
import brands from '../data/brands'

const headerIconClassName = 'display:block width:100% height:100% max-width:100% max-height:100%'
const headerIconStyle = {
  display: 'block',
  width: '100%',
  height: '100%',
  maxWidth: '100%',
  maxHeight: '100%'
} satisfies CSSProperties
/** Resolve optional brand icons at the page that requests them. */
export default function createHeaderIcon(name: keyof typeof brands) {
  const brand = brands[name]
  if (!brand) throw new Error(`Brand ${name} not found`)
  return <brand.src className={clsx(headerIconClassName, brand.headerClassName)} style={headerIconStyle} />
}
