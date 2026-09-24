import styled from '@master/styled.react'

const DocBadge = styled.div<{
  color?: 'primary' | 'fade',
  size?: 'xs' | 'sm' | 'md'
}>(
  'inline-flex items-center justify-center r:3px font-weight:460 tracking-tight',
  {
    color: {
      primary: 'bg-accent/.1 fg-accent',
      fade: 'bg-surface-base'
    },
    size: {
      xs: 'h:1rem px-3xs font-2xs',
      sm: 'h:1.25rem px-2xs font-xs',
      md: 'h:1.75rem px-xs font-xs'
    },
  },
  ({ outlined }) => outlined && 'b:1px|solid|var(--color-line-subtle) text-strong'
)

export default DocBadge
