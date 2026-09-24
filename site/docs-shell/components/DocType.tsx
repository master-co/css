import { IconBox, IconCheck, IconLetterT, IconNumbers } from '@tabler/icons-react'
import clsx from 'clsx'
import DocBadge from './DocBadge'
import InlineCode from './InlineCode'

const iconProps = {
  className: 'stroke-width:1.5 mr:0.125rem bg:text/.1 r:0.25rem p:0.125rem flex:0|0|auto',
  width: 14,
  height: 14
}

export function DocStringType({ className }: any) {
  return (
    <DocBadge className={clsx('font-mono', className)}>
      <IconLetterT {...iconProps} />
      <InlineCode lang="ts">string</InlineCode>
    </DocBadge>
  )
}

export function DocNumberType({ className }: any) {
  return (
    <DocBadge className={clsx('font-mono', className)}>
      <IconNumbers {...iconProps} />
      <InlineCode lang="ts">number</InlineCode>
    </DocBadge>
  )
}

export function DocBooleanType({ className }: any) {
  return (
    <DocBadge className={clsx('font-mono', className)}>
      <IconCheck {...iconProps} />
      <InlineCode lang="ts">boolean</InlineCode>
    </DocBadge>
  )
}

export function DocObjType({ children, className }: any) {
  return (
    <DocBadge className={clsx('font-mono', className)}>
      <IconBox {...iconProps} />
      {children}
    </DocBadge>
  )
}

export function DocDefaultValue({ children, className }: any) {
  return (<DocBadge className={clsx('font-mono', className)}>{children}</DocBadge>)
}

export function DocType({ type, className }: any) {
  if (type.startsWith('\'')) {
    return <DocBadge className={clsx('font-mono', className)}><InlineCode className="white-space:nowrap" lang="ts">{type}</InlineCode></DocBadge>
  }
  switch (type) {
    case 'string':
      return <DocStringType className={className} />
    case 'number':
      return <DocNumberType className={className} />
    case 'boolean':
      return <DocBooleanType className={className} />
    case 'void':
      return <DocBadge className={clsx('font-mono', className)}><InlineCode className="white-space:nowrap" lang="ts">void</InlineCode></DocBadge>
    default:
      return <DocObjType className={className}><InlineCode className="white-space:nowrap" lang="ts">{type}</InlineCode></DocObjType>
  }
}
