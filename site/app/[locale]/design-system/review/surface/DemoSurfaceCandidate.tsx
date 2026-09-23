import type { HTMLAttributes } from 'react'
import clsx from 'clsx'
import styles from './page.module.css'

/** Review-only surface paint. Callers own dimensions, layout, padding and clipping. */
export default function DemoSurfaceCandidate({ elevation = 'none', className, ...props }: HTMLAttributes<HTMLDivElement> & {
  elevation?: 'none' | 'raised'
}) {
  return <div {...props} data-elevation={elevation} className={clsx(styles.surfaceCandidate, className)} />
}
