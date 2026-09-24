'use client'

import type { ReactNode } from 'react'
import { useTranslation } from '../contexts/i18n'

export default function Translate({ children }: { children: ReactNode }) {
  const $ = useTranslation()
  return <>{translateNode(children, $)}</>
}

function translateNode(node: ReactNode, translate: (text: string) => string): ReactNode {
  if (typeof node === 'string') return translate(node)
  if (typeof node === 'number') return translate(String(node))
  if (Array.isArray(node)) return node.map((child) => translateNode(child, translate))
  return node
}
