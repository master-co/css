'use client'

import { useEffect, useRef } from 'react'
import clsx from 'clsx'

const cellWidth = 10
const cellHeight = 20
const glyphs = 'abcdefghijklmnopqrstuvwxyz0123456789-:@()|/.'
const baseAlpha = 0.04
const flipsPerSecond = 14
const frameInterval = 1000 / 30

/**
 * Class names drawn as a faint character matrix. A soft light follows the pointer, or drifts
 * when idle, and a few cells at a time decode back into their class text.
 */
export default function GlyphField({ className, lines }: { className?: string, lines: readonly string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    // Islands render inside a `display: contents` wrapper, so the canvas measures itself and listens on its section.
    const host = canvas.closest<HTMLElement>('[data-glyph-host]') ?? canvas
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    const base = document.createElement('canvas')
    const baseContext = base.getContext('2d')!
    let width = 0
    let height = 0
    let ratio = 1
    let columns = 0
    let rows = 0
    let chars: string[] = []
    const decoding = new Map<number, number>()
    let ink = '#000'
    let signal = '#fc0'
    let font = '11px monospace'
    let frame = 0
    let lastDraw = 0
    let visible = true
    const pointer = { x: 0.5, y: 0.3, targetX: 0.5, targetY: 0.3, active: false }

    const prepare = (target: CanvasRenderingContext2D) => {
      target.setTransform(ratio, 0, 0, ratio, 0, 0)
      target.font = font
      target.textAlign = 'center'
      target.textBaseline = 'middle'
    }

    const paintBase = () => {
      prepare(baseContext)
      baseContext.clearRect(0, 0, width, height)
      baseContext.fillStyle = ink
      baseContext.globalAlpha = baseAlpha
      chars.forEach((char, index) => {
        if (char !== ' ') baseContext.fillText(char, (index % columns) * cellWidth + cellWidth / 2, Math.floor(index / columns) * cellHeight + cellHeight / 2)
      })
    }

    const readStyle = () => {
      const style = getComputedStyle(canvas)
      ink = style.color
      signal = style.getPropertyValue('--home-signal').trim() || signal
      font = `500 11px ${style.getPropertyValue('--home-mono').trim() || 'monospace'}`
    }

    const layout = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      ratio = Math.min(devicePixelRatio || 1, 2)
      for (const target of [canvas, base]) {
        target.width = Math.round(width * ratio)
        target.height = Math.round(height * ratio)
      }
      columns = Math.ceil(width / cellWidth)
      rows = Math.ceil(height / cellHeight)
      // Each row reads as a run of real class names, offset so the columns never line up.
      chars = Array.from({ length: columns * rows }, (_, index) => {
        const row = Math.floor(index / columns)
        const text = lines[row % lines.length]
        return text[(index % columns + row * 37) % text.length]
      })
      decoding.clear()
      readStyle()
      paintBase()
      prepare(context)
    }

    const drawCell = (index: number, alpha: number, color: string, char: string) => {
      const x = (index % columns) * cellWidth
      const y = Math.floor(index / columns) * cellHeight
      context.clearRect(x, y, cellWidth, cellHeight)
      context.globalAlpha = alpha
      context.fillStyle = color
      context.fillText(char, x + cellWidth / 2, y + cellHeight / 2)
    }

    const draw = (time: number, elapsed: number) => {
      context.globalAlpha = 1
      context.clearRect(0, 0, width, height)
      context.drawImage(base, 0, 0, width, height)
      pointer.x += (pointer.targetX - pointer.x) * 0.07
      pointer.y += (pointer.targetY - pointer.y) * 0.07
      if (!pointer.active) {
        pointer.targetX = 0.5 + Math.sin(time / 5600) * 0.34
        pointer.targetY = 0.32 + Math.cos(time / 7300) * 0.16
      }
      const lightX = pointer.x * width
      const lightY = pointer.y * height
      const radius = Math.max(200, width * 0.2)
      // Cells inside the light brighten with distance falloff.
      const firstColumn = Math.max(0, Math.floor((lightX - radius) / cellWidth))
      const lastColumn = Math.min(columns - 1, Math.ceil((lightX + radius) / cellWidth))
      const firstRow = Math.max(0, Math.floor((lightY - radius) / cellHeight))
      const lastRow = Math.min(rows - 1, Math.ceil((lightY + radius) / cellHeight))
      for (let row = firstRow; row <= lastRow; row++) {
        for (let column = firstColumn; column <= lastColumn; column++) {
          const index = row * columns + column
          if (chars[index] === ' ' || decoding.has(index)) continue
          const light = Math.max(0, 1 - Math.hypot(column * cellWidth + cellWidth / 2 - lightX, row * cellHeight + cellHeight / 2 - lightY) / radius)
          if (light > 0.02) drawCell(index, baseAlpha + light * light * 0.24, ink, chars[index])
        }
      }
      // A few cells scramble briefly, then settle back to their class character.
      const flips = flipsPerSecond * elapsed / 1000
      for (let count = Math.floor(flips) + (Math.random() < flips % 1 ? 1 : 0); count > 0; count--) {
        const index = (Math.random() * chars.length) | 0
        if (chars[index] !== ' ') decoding.set(index, time + 500 + Math.random() * 900)
      }
      for (const [index, settleAt] of decoding) {
        const column = index % columns
        const row = Math.floor(index / columns)
        const light = Math.max(0, 1 - Math.hypot(column * cellWidth + cellWidth / 2 - lightX, row * cellHeight + cellHeight / 2 - lightY) / radius)
        if (time >= settleAt) {
          decoding.delete(index)
          drawCell(index, baseAlpha + light * light * 0.24, ink, chars[index])
        } else {
          drawCell(index, 0.22 + light * 0.5, light > 0.3 ? signal : ink, glyphs[(Math.random() * glyphs.length) | 0])
        }
      }
    }

    const tick = (time: number) => {
      frame = requestAnimationFrame(tick)
      if (!visible || time - lastDraw < frameInterval) return
      const elapsed = Math.min(time - lastDraw, 200)
      lastDraw = time
      draw(time, elapsed)
    }

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.targetX = (event.clientX - rect.left) / rect.width
      pointer.targetY = (event.clientY - rect.top) / rect.height
      pointer.active = true
    }
    const onPointerLeave = () => {
      pointer.active = false
    }
    const restyle = () => {
      readStyle()
      paintBase()
      prepare(context)
      if (reduceMotion) draw(0, 0)
    }

    layout()
    const resize = new ResizeObserver(() => {
      layout()
      if (reduceMotion) draw(0, 0)
    })
    resize.observe(canvas)
    const theme = new MutationObserver(restyle)
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] })
    const scheme = matchMedia('(prefers-color-scheme: dark)')
    scheme.addEventListener('change', restyle)
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    intersection.observe(canvas)
    if (reduceMotion) {
      draw(0, 0)
    } else {
      host.addEventListener('pointermove', onPointerMove)
      host.addEventListener('pointerleave', onPointerLeave)
      frame = requestAnimationFrame(tick)
    }

    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
      theme.disconnect()
      intersection.disconnect()
      scheme.removeEventListener('change', restyle)
      host.removeEventListener('pointermove', onPointerMove)
      host.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [lines])

  return <canvas aria-hidden="true" className={clsx('home-glyph-field', className)} ref={canvasRef} />
}
