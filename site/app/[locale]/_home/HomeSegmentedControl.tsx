'use client'

import type { ComponentPropsWithoutRef, ReactNode } from 'react'
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
            className={clsx('home-segmented-control', className)}
            role="group"
            style={style}
            {...props}>
            {options.map((option) => {
                const active = option.value === value
                return (
                    <button
                        aria-pressed={active}
                        className={clsx(
                            'home-segmented-control-option',
                            active ? 'home-segmented-control-option-active' : 'home-segmented-control-option-idle'
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
