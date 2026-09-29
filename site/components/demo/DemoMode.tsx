import type { ReactNode } from 'react'
import { IconMoon, IconSun } from '@tabler/icons-react'

/** Pair these halves in a Demo canvas with an inline-size container. */
function DemoMode({ mode, children }: { mode: 'light' | 'dark', children: ReactNode }) {
  const dark = mode === 'dark'
  return <div className={`demo-mode ${mode}`}>
    <div className={`position:relative overflow:hidden background-image:var(--stripe-image) background-position:0 background-size:7.5px|7.5px ${dark ? 'bg-surface-base' : 'bg-surface-raised'}`}>
      {dark
        ? <IconMoon className="position:absolute right-md top-md font-size-xs fg-text-muted" strokeWidth={1} width={24} height={24} aria-hidden="true" />
        : <IconSun className="position:absolute left-md top-md font-size-xs fg-text-muted" strokeWidth={1} width={24} height={24} aria-hidden="true" />}
      <div className="demo-mode-preview py-2xl">
        {children}
      </div>
    </div>
  </div>
}

export function DemoLight({ children }: { children: ReactNode }) {
  return <DemoMode mode="light">{children}</DemoMode>
}

export function DemoDark({ children }: { children: ReactNode }) {
  return <DemoMode mode="dark">{children}</DemoMode>
}
