'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import clsx from 'clsx'
import type { HomeSectionId } from './home-content'

export const homeViewport = {
    once: true,
    amount: 0.18
}

export const homeTransition = {
    duration: 0.55,
    ease: [0.22, 1, 0.36, 1]
} as const

export const homeSpring = {
    type: 'spring',
    stiffness: 280,
    damping: 32,
    mass: 0.8
} as const

export const homeHover = {
    rest: {
        y: 0,
        scale: 1,
        boxShadow: '0 1px 2px rgb(0 0 0 / .04)'
    },
    hover: {
        y: -4,
        scale: 1.006,
        boxShadow: '0 22px 70px rgb(0 0 0 / .12)'
    }
} as const

export function useHomeMotionEnabled() {
    return !useReducedMotion()
}

export function MotionSection({
    children,
    className,
    homeSection,
    id,
    delay = 0
}: {
    children: ReactNode
    className?: string
    homeSection?: HomeSectionId
    id?: string
    delay?: number
}) {
    const reduceMotion = useReducedMotion()

    return (
        <motion.section
            className={className}
            data-home-section={homeSection}
            id={id}
            initial={reduceMotion ? false : { y: 12 }}
            transition={{ ...homeTransition, delay }}
            viewport={homeViewport}
            whileInView={reduceMotion ? undefined : { y: 0 }}>
            {children}
        </motion.section>
    )
}

export function MotionDiv({
    children,
    className,
    delay = 0
}: {
    children: ReactNode
    className?: string
    delay?: number
}) {
    const reduceMotion = useReducedMotion()

    return (
        <motion.div
            className={clsx(className)}
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ ...homeTransition, delay }}>
            {children}
        </motion.div>
    )
}

export function MotionHoverSurface({
    children,
    className
}: {
    children: ReactNode
    className?: string
}) {
    const motionEnabled = useHomeMotionEnabled()

    return (
        <motion.div
            animate="rest"
            className={clsx(className)}
            initial="rest"
            transition={homeSpring}
            variants={homeHover}
            whileHover={motionEnabled ? 'hover' : undefined}
            whileTap={motionEnabled ? { y: -1, scale: 0.998 } : undefined}>
            {children}
        </motion.div>
    )
}

export function MotionVisualFrame({
    children,
    className
}: {
    children: ReactNode
    className?: string
}) {
    return (
        <motion.div
            className={clsx(className)}
            transition={homeSpring}
            variants={{
                rest: { opacity: 1, y: 0 },
                hover: { opacity: 1, y: -2 }
            }}>
            {children}
        </motion.div>
    )
}

export function MotionBarFill({
    className,
    delay = 0,
    percent
}: {
    className?: string
    delay?: number
    percent: number
}) {
    const reduceMotion = useReducedMotion()
    const width = `${percent}%`

    return (
        <motion.div
            className={clsx(className)}
            initial={reduceMotion ? false : { width: '0%' }}
            style={reduceMotion ? { width } : undefined}
            transition={{ ...homeTransition, delay }}
            viewport={homeViewport}
            whileInView={reduceMotion ? undefined : { width }} />
    )
}
