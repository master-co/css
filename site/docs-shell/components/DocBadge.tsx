import styled from '@master/styled.react'

const DocBadge = styled.div<{
  color?: 'primary' | 'fade',
  size?: 'xs' | 'sm' | 'md'
}>(
  'display:inline-flex align-items:center justify-content:center border-radius:3px font-weight:460 tracking-tight',
  {
    color: {
      primary: 'bg-accent/.1 fg-accent',
      fade: 'bg-surface-base'
    },
    size: {
      xs: 'height:1rem px-3xs font-size-2xs',
      sm: 'height:1.25rem px-2xs font-size-xs',
      md: 'height:1.75rem px-xs font-size-xs'
    },
  },
  ({ outlined }) => outlined && 'border-width:1px border-style:solid b-line-subtle fg-text-strong'
)

export default DocBadge
