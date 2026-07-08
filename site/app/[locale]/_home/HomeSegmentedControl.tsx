'use client'

import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react'
import clsx from 'clsx'

export interface HomeSegmentedControlOption<Value extends string> {
    label: ReactNode
    value: Value
}

export interface HomeSegmentedControlProps<Value extends string> extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'onChange' | 'role'> {
    onValueChange: (value: Value) => void
    options: readonly HomeSegmentedControlOption<Value>[]
    value: Value
}

const homeSegmentedControlStyle = {
    '--home-segmented-control-padding': '3px',
    '--home-segmented-control-radius': 'var(--radius-xl)'
} as CSSProperties

const homeSegmentedControlButtonRadiusClassName = 'r:max(0px,calc(var(--home-segmented-control-radius)-var(--home-segmented-control-padding)))'

export default function HomeSegmentedControl<Value extends string>({
    className,
    onValueChange,
    options,
    style,
    value,
    ...props
}: HomeSegmentedControlProps<Value>) {
    return (
        <div
            className={clsx(
                'inline-flex items-center gap:1px w:fit p:var(--home-segmented-control-padding) r:var(--home-segmented-control-radius) surface:muted',
                className
            )}
            role="group"
            style={{ ...homeSegmentedControlStyle, ...style }}
            {...props}>
            {options.map((option) => {
                const active = option.value === value
                return (
                    <button
                        aria-pressed={active}
                        className={clsx(
                            'inline-flex items-center justify-center h:8x min-w:14x px:md b:0 font:medium font:xs leading:1 white-space:nowrap cursor:pointer',
                            homeSegmentedControlButtonRadiusClassName,
                            active ? 'surface:raised text:strong shadow:xs' : 'bg:transparent text:muted text:strong:hover'
                        )}
                        key={option.value}
                        onClick={() => {
                            if (!active) onValueChange(option.value)
                        }}
                        type="button">
                        {option.label}
                    </button>
                )
            })}
        </div>
    )
}
